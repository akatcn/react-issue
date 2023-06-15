# set state 함수를 중첩하였을 때의 에러 해결기

state 끌어올리기를 하며 겪었던 에러를 정리하고 왜 그런 에러가 발생하였는지, 어떻게 해결하였는지에 대한 기록을 남겨보려 한다

## 이슈 특정하기
먼저 다음과 같이 일반적인 state 끌어올리기를 활용하여 자식 컴포넌트에서 부모 컴포넌트의 상태를 바꾸는 식의 애플리케이션을 구성하였다:

```tsx
/* Parent.tsx */
function Parent() {
  const [parentNum, setParentNum] = useState(0);
  return (
    <div>
      <p>parentNum: {parentNum}</p>
      <Child setParentNum={setParentNum} />
    </div>
  )
}
```

```tsx
/* Child.tsx */
function Child({setParentNum}: ChildProps) {
  const handleClick = () => {
    setParentNum((oldState) => {
      return oldState + 1;
    })
  }
  return (
    <div>
      <button onClick={handleClick}>증가</button>
    </div>
  )
}
```

![Untitled](https://user-images.githubusercontent.com/96981852/228582858-d98ba6dd-df3d-406e-9a3b-923380fdb2e8.png)

잘 동작하는 코드이다. 하지만 만일 `Child` 컴포넌트에서 `parentNum`이 5 → 6으로 state 변화가 되는 순간에 자신이 가진 `childNum`을 15로 만들어서 렌더링 하고 싶다면 어떻게 될까??

분명 다음과 같은 코드를 작성해야만 할 것이다:

```tsx
/* Child.tsx */
function Child({setParentNum}: ChildProps) {
  const [childNum, setChildNum] = useState(0);
  const handleClick = () => {
    setParentNum((oldState) => {
      if (oldState === 5) {  // 의도: parentNum이 5라는 값을 떠날 때 childNum을 15로 세팅하고 싶다
        setChildNum(15);
      }
      return oldState + 1;
    })
  }
  return (
    <div>
      <p>childNum: {childNum}</p>
      <button onClick={handleClick}>증가</button>
    </div>
  )
}
```

하지만 이렇게 코드를 작성하면 다음과 같이 warning이 발생하게 된다:

![Untitled](https://user-images.githubusercontent.com/96981852/228585147-69f49f20-5b38-481f-9ec9-d90192782e9a.gif)

에러메시지: Warning: Cannot update a component (`Child`) while rendering a different component (`Parent`) → 해석: `Parent`라는 다른 컴포넌트를 렌더링하는 동안 `Child` 컴포넌트를 업데이트 할 수 없음

이 에러가 발생하는 코드는 다음과 같다:

```tsx
function Child({setParentNum}: ChildProps) {
	...
  const handleClick = () => {
    setParentNum((oldState) => {
      if (oldState === 5) {
        setChildNum(15);
      }
      return oldState + 1;
    })
  }
```

중첩된 set state 함수가 문제 발생의 원인이 된 것이다

`setParentNum`이라는 set state 함수를 통해 `Parent` 컴포넌트의 상태를 변화시키는 도중에(=재렌더링이 발생되는 행위) `Child` 컴포넌트의 set state 함수를 사용하며 `Child` 컴포넌트의 상태를 변화하는 것이 문제가 된 것이다

이는 리액트의 set state 함수의 동작 방식과도 관련이 있다. 리액트는 set state 함수를 비동기적으로 실행하며, 그 즉시 상태 변경을 순차적으로 처리하는 것이 아닌 일괄처리를 한다는 것이다. 그러니 아무리 절차지향적으로 코드를 작성하더라도 의도와 다르게 동작할 수 있다는 것이다

그러니 서로 다른 컴포넌트의 set state 함수를 중첩시켜 사용하는 것은 예측할 수 없는 동작을 하게되므로 올바른 코드가 아니다

그렇다면 해결하는 방법은 무엇일까?? 우리는 `Parent`의 `parentNum`이 5에서 6이든 7이든 상태 변화가 발생할 때 `childNum`을 15로 세팅하고 싶은 것 뿐이다. 이 목표를 만족하려면 코드를 어떻게 작성해야만 할까??

## 해결하기

### 첫 번째 해결방법) props로 부모 상태 추적하기

해결 방법은 간단하다. 바로 중첩을 피하면 된다:

```tsx
/* Parent.tsx */
function Parent() {
  const [parentNum, setParentNum] = useState(0);
  return (
    <div>
      <p>parentNum: {parentNum}</p>
      <Child parentNum={parentNum} setParentNum={setParentNum} /> 
    </div>
  )
}
```

```tsx
/* Child.tsx */
function Child({setParentNum, parentNum}: ChildProps) {
  const [childNum, setChildNum] = useState(0);
  const handleClick = () => {
    if (parentNum === 5) {
      setChildNum(15);
    }
    setParentNum((oldState) => {
      return oldState + 1;
    })
  }
  return (
    <div>
      <p>childNum: {childNum}</p>
      <button onClick={handleClick}>증가</button>
    </div>
  )
}
```

이를 위해 `parentNum`을 감시하기 위해 `Parent`로부터 props를 하나 추가하였다. 그런다음 set state 함수를 연달아 두 번 실행시켰다. 이렇게하니 원하는 동작이 이뤄지고, warning도 발생하지 않았다

이 방법은 분명 잘 동작한다. 하지만 오직 `parentNum`의 값 변화를 감지하기 위한 목적으로 props를 추가로 넘기는 것은 간결하지 못하다

### 두 번째 해결방법) setTimeout 사용하기

결국 리액트 내부에서 set state 함수를 어떻게 처리할지 모르기 때문에 앞선 이슈가 발생하였던 것이다. 그리하여 내가 예측 가능한 형태로 동작하게끔 하면 된다는 생각을 하게 되었다. 즉, `setChildNum`로직을 비동기적으로 가장 나중에 실행되게끔 하는 것이다

이를 위해 `setTimeout`을 사용하였다. 단, 딜레이 시간을 `0`으로 주어 예약된 set state 함수가 모두 동작하고 곧바로 실행되게끔 하였다. 코드는 다음과 같다:

```tsx
function Child({ setParentNum }: ChildProps) {
  ...
    setParentNum((oldState) => {
      if (oldState === 5) {
        setTimeout(() => {
          setChildNum(15);
        }, 0)
      }
      return oldState + 1;
    });
  }
  ...
}
```

에러가 발생되지 않고 잘 실행된다. 이걸 통해 추가적인 props를 주고받을 필요도 없게 되었다

하지만 아직까지는 내가 생각하는 완벽한 해결법은 아닌 것 같다. 결국 절차지향적으로 처리해야하는 동작을 비동기적인 특성을 사용해서 해결한 것이니 말이다. `setTimeout` 역시 비동기 적으로 실행되고 처리되기 때문에 의도치 않은 동작을 할 가능성은 여전히 남아있다 생각한다

어딘가 set state 함수가 중복되더라도 호출한 순서대로 처리되는 동시에 재렌더링을 막는 코드가 있을 것 같다. 나중에라도 그런 코드를 발견하면 다시 업데이트 해야지…
