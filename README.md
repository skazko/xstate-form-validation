- [x] синхронная валидация одного поля (пример - минимальная длина поля)
- [x] асинхронная валидация одного поля (пример - проверка на сервере занято ли имя пользователя)
- [ ] синхронная валидация всей формы, ошибка присваивается конкретному полю (пример: пароль - повторение пароля)
- [ ] асинхронная валидация всей формы, ошибка присваивается конкретному полю (пример: предварительная проверка - извините, ваш тариф не позволяет создание такого количества узлов)
- [ ] асинхронная валидация всей формы, ошибка присваивается всей форме

# Валидация одного поля

## Пример

### React

для удобства использования создатим хук:

```javascript
import { useRef, useEffect, useState } from "react";
import { createValidationService } from "xstate-form-validation";

export function useValidate(rules, asyncValidator) {
  const [isValid, setValid] = useState(false);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const ref = useRef();
  const [{ service, register, updateRules }] = useState(createValidationService({ rules, asyncValidator }));

  useEffect(() => {
    // регистрируем поле
    register(ref.current);
    // устанавливаем обработчик изменения состояния
    service.onTransition((state) => {
      // при изменении состояния устанавливаем соответствующие значения
      if (state.matches("valid") || state.matches("invalid")) {
        setValid(state.matches("valid"));
        setError(state.matches("valid") ? null : state.context.error);
      }
      setPending(state.matches("pending"));
    });
  }, []);

  // обновляем правила проверки значения при их изменении
  useEffect(() => {
    updateRules(rules, ref.current.value);
  }, [rules]);

  return { isValid, ref, error, pending };
}
```

И используем его в компоненте:

```javascript
function App() {
  // Поле имя обязательное
  const nameRequired = useCallback(required("Input your name"), []);
  // и в нем должно быть больше трех символов
  const nameMinLength = useCallback(minLength(3, "Name should be more than 3 symbols"), []);
  // проверям не зарегистрировано ли уже такое имя
  const nameCheck = useCallback(checkName, []);
  const [nameRules] = useState([nameRequired, nameMinLength]);
  const { isValid, ref, error, pending } = useValidate(nameRules, nameCheck);

  const onSubmit = (e) => {
    e.preventDefault();
  };
  return (
    <form style={{ margin: "0 auto", maxWidth: "640px", paddingTop: "50px" }} onSubmit={onSubmit}>
      <div>
        <div className="fieldContainer">
          <input
            disabled={pending}
            ref={ref}
            className="field"
            style={{
              borderColor: isValid ? "green" : error ? "red" : "black",
            }}
            type="text"
          />
          {error && <span style={{ color: "red" }}>{error}</span>}
        </div>
      </div>
      <button disabled={pending || !isValid} type="submit">
        Submit
      </button>
    </form>
  );
}

export default App;
```

## `createValidationService(config)`

Устанавливает правила проверки в контекст машины интерпретирует ее и стартует.

`config.rules` - массив функций-правил для проверки
`config.asyncValidator` - функция асинхронной(серверной) проверки

### Возвращает:

```javascript
{
  service,
  register,
  updateRules,
  validate,
  machine,
}
```

### `service` - интерпретированный сервис для машины

### `register(input)` - функция для установки обработчика - валидатора на инпут

### `updateRules(rules, value)` - функция для обновления правил проверки

### `validate(value)` - функция для валидации значения

### `machine` - машина

## Описание

Для валидации поля его нужно зарегистрировать, с помощью функции `register`, на вход передать `HTMLInputElement` который нужно валидировать.

### Синтаксис

```javascript
register(input);
```

### Параметры

`input` - HTMLInputElement ввод которого нужно валидировать

Для отображения текущего состояния использовать `service.onTransition`

### Синтаксис

```javascript
service.onTransition(callback);
```

### Параметры

`callback` - функция вызывающаяся при изменении состояния, принимает на вход 1 аргумент - текущее состояние: [state](https://xstate.js.org/api/classes/state.html). Для проверки, что текущее состояние валидно, можно использовать `state.matches('valid')`, а что состояние не валидно - `state.matches('invalid')`. Текст ошибки, при наличии - `state.context.error`

Для синхронной валидации используются функции - правила проверки введенного значения. Если правило возвращает значение отличное от true, тогда валидация считается не пройденной, если из функции возвращается строка, она будет сохранена в контексте и может быть использована ~~против вас~~ в качестве сообщения об ошибке.

Стейт машина имеет 4 состояния: начальное, валидация, валидное и не валидное, для перехода в состояние валидации необходимо отправлять событие `VALIDATE`:

```javascript
{
  type: "VALIDATE",
  value: e.target.value
}
```

- `value` - значение поля

Валидация реализована в виде функции возвращающей промис, если валидация "прошла" промис резолвится, если нет - отклоняется. Описание ошибки валидации хранится в контексте, так же как и массив функций - правил валидации.

## Ограничения

1. При динамическом формировании правил проверки, для обновления набора правил в контексте машины необходимо использовать функцию `updateRules`.

   ### Синтаксис

   ```javascript
   updateRules(rules, value);
   ```

   ### Параметры

   - `rules` - массив функций - валидаторов
   - `value` - текущее значение для валидации по новым правилам

   Изначально я рассматривал вариант, когда правила передаются в функцию валидации, но в таком случае валидация происходит снаружи библиотеки

2. Валидация происходит сразу по событию `input`, необходимо добавить различные сценарии валидации, но при этом эти сценарии все равно будут ограничены.
3. То же и для асинхронной валидации, в данный момент происходит при потере фокуса полем. 

## Почему выбрано такое решение

1. Для удобства работы с машиной ее удобно интерпретировать, поэтому я решил экспортировать функцию, которая сразу интерпретирует сервис и запускает его и возвращает его и нужные функции
2. Т.к. у нас библиотека для валидации, мы хотим просто описывать как валидировать, поэтому обработчик в котором происходит валидация устанавливается внутри библиотеки.
3. Функция `register` вынесена отдельно для возможности вешать обработчики на поля, которых еще нет на странице
4. Асинхронная валидация недоступна из состояния `invalid`
