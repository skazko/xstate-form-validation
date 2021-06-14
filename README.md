- [x] синхронная валидация одного поля (пример - минимальная длина поля)
- [ ] асинхронная валидация одного поля (пример - проверка на сервере занято ли имя пользователя)
- [ ] синхронная валидация всей формы, ошибка присваивается конкретному полю (пример: пароль - повторение пароля)
- [ ] асинхронная валидация всей формы, ошибка присваивается конкретному полю (пример: предварительная проверка - извините, ваш тариф не позволяет создание такого количества узлов)
- [ ] асинхронная валидация всей формы, ошибка присваивается всей форме

# Валидация одного поля

## Пример

### React

для удобства использования создатим хук:

```javascript
import { useMachine } from "@xstate/react";
import { formMachine, utils } from "xstate-form-validation";
const { createRegister, createFormData, createSubmit, createSubmitService } = utils;

export function useForm({ onSubmit = () => Promise.resolve() } = {}) {
  // запускает машину с сервисом для отправки формы
  const [state, send] = useFormMachine(formMachine, onSubmit);
  // создает функцию для регистрации полей
  const register = createRegister(state, send);
  // создает функцию отправки формы
  const submit = createSubmit(send);
  // получает данные формы для отображения
  const form = createFormData(state);

  return { register, submit, form };
}

// Вспомогательный хук
function useFormMachine(machine, submitCb) {
  // запускает машину с сервисом
  const [state, send, service] = useMachine(
    machine.withConfig({ services: { submitService: createSubmitService(submitCb) } }),
    { devTools: true }
  );

  return [state, send, service];
}
```

И используем его в компоненте:

```javascript
import { useForm } from "../hooks/useForm";

function App() {
  const { register, submit, form } = useForm({
    // этот колбек будет вызываться при переходе формы в состояние submit
    // должен возвращать промис
    onSubmit: (data) => {
      console.log(data);
      return Promise.resolve();
    },
  });
  const { hasError, errors, fields } = form;
  const { name, password } = fields;

  return submitted ? (
    <span>Спасибо за регистрацию</span>
  ) : (
    <form style={{ margin: "0 auto", maxWidth: "640px", paddingTop: "50px" }} onSubmit={submit}>
      <div className="formField">
        <div className="fieldContainer">
          <input
            {...register({
              name: "name",
              rules: [
                (v) => !!v || "Введите имя",
                (v) => v.trim().length >= 3 || "Имя должно быть как минимум из 3 символов",
              ],
            })}
            className="field"
            type="text"
          />
          {name.hasError && <span style={{ color: "red" }}>{errors.name}</span>}
        </div>
      </div>
      <div className="formField">
        <div className="fieldContainer">
          <input
            {...register({
              name: "password",
              rules: [
                (v) => !!v || "Введите пароль",
                (v) => v.trim().length >= 6 || "Пароль должен быть как минимум из 6 символов",
              ],
            })}
            className="field"
            type="password"
          />
          {password.hasError && <span style={{ color: "red" }}>{errors.password}</span>}
        </div>
      </div>

      <button disabled={hasError} type="submit">
        Submit
      </button>
    </form>
  );
}
```

## Описание

Форма описана в `lib/machines/formMachine.js`. Начальное состояние - `idle`, из этого состояния можно перейти в состояние `validation`, при этом сразу запускается валидация всех полей, после завершения валидации, если не возникло ошибок, переходим в состояние `submit`. При переходе в `submit` запускается сервис отправки формы, и если в процессе отправки не возникает ошибок переходим в финальное состояние `submitted`. В случае возникновения ошибок переходим в состояние `error`. Из этого состояния можно перейти в состояние `valid`, если все валидации проходят и далее к `submit`.

Состояние отдельного поля описано в `lib/machines/fieldMachine.js`. В контексте хранятся `name` имя поля (html аттрибут), `rules` - массив функция правил проверки, `error` - сообщение ошибки валидации, `value` - текущий ввод. Начальное состояние - `idle`, из этого состояния можно перейти в состояние `validation` при этом запускается сервис для валидации поля. В случае успешной валидации переходим в состояние `valid`, в противном случае - `error`. Машины поля порождаются в машине формы и отправляют сообщения родительской машине при изменении состояния.

Для удобства использования есть утилиты в `lib/utils.js`.

### `createRegister(state, send, mode = 'onChange')`

Создает функцию для регистрации полей в машине формы.

### Возвращает:

```typescript
function({
  rules = [], // массив функций проверки значения
  name, // имя поля
  defaultValue = "" // значение поля по умолчанию
  } = {}): {
    name, // имя поля
    [mode] // обработчик который надо повесить на инпут
  }
```

### `createSubmitService(cb: () => Promise<unknown>)`

Создает сервис для отправки формы.

`cb` - функция отправки формы должна возвращать Promise

### `createSubmit(send)`

Создает функцию для отправки формы.

### `createFormData(state)`

Создает объект с данными формы из текущего состояния машины формы.

### Возвращает:

```typescript
{
  submitted: Boolean, // отправлена ли форма
  hasError: Boolean, // есть ли в форме ошибки
  // мапа с ошибками,  ключ - имя поля с ошибкой
  errors: {
    [key: string]: string, 
  },
  // мапа с данными по полю, ключ - имя поля
  fields: {
    [key: string]: {
      isValid: Boolean, // валидно ли поле
      hasError: Boolean, // есть ли в поле ошибки
      value, // значение поля
    }
  },
}
```
Для синхронной валидации используются функции - правила проверки введенного значения. Если правило возвращает значение отличное от true, тогда валидация считается не пройденной, если из функции возвращается строка, она будет сохранена в контексте и может быть использована ~~против вас~~ в качестве сообщения об ошибке.
## Использование (пример на React)
1) Для начала необходимо добавить в конфиг машины сервис для отправки формы и интерпретировать машину формы, создать сервис можно при помощи `createSubmitService`:

```javascript
import { useMachine } from "@xstate/react";

const submitForm = (data) => some.api.submit(data);

const [state, send, service] = useMachine(
    machine.withConfig({ services: { submitService: createSubmitService(submitForm) } })
  );
```
2) Далее нужны функции для регистрации полей и отправки формы:

```javascript
const register = createRegister(state, send);
const submit = createSubmit(send);
```

3) А также информация о форме:

```javascript
const form = createFormData(state);
```

4) Далее в компоненте регистрируем поле

```jsx
<input
  {...register({
    name: "name",
    rules: [
      (v) => !!v || "Введите имя",
      (v) => v.trim().length >= 3 || "Имя должно быть как минимум из 3 символов",
    ],
  })}
  type="text"
/>
```

5) Данные о состоянии формы можно взять в `form` и отправить ее при помощи `submit`.

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

2. Текущая реализация адаптирована под использование с react (createRegister), возможно понадобяться дополнительные функции для универсальности

## Почему выбрано такое решение

1. Использование набора функций для валидации на мой взгляд универсальный и удобный подход, хотя конечно можно было бы сделать какие-то готовые функции (required, minLength)
2. Данное решение позволяет описывать правила проверки декларативно

