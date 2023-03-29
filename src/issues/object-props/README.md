# 객체를 state로써 관리할 때

채팅 박스를 만들며 발생한 이슈를 해결한 순간을 정리하기 위해 기록한다

## 구현하려 했던 것

먼저 내가 구성한 채팅 박스의 UI와 컴포넌트 구조는 다음과 같다:

![Untitled](https://user-images.githubusercontent.com/96981852/228618098-ef228169-d1ee-4eb3-bde4-37f0e3c750b6.png)

채팅 기능을 구현하기 위한 프로토콜로는 STOMP를 사용하였는데, STOMP에서 공인한 implementation중 하나인 [StompJS의 가이드](https://stomp-js.github.io/guide/stompjs/using-stompjs-v5.html)에 따라 빌드를 하게 되었다. 해당 라이브러리에서 가장 중요한 것은 `Client` 객체 이었는데, 이 객체는 브로커 서버와의 연결은 물론이고 송, 수신까지 전부 관리하는 객체였다, 그러므로 채팅 메시지 연결에 관여하는 모든 컴포넌트는 해당 객체를 공유했어야만 했다

그리하여 내가 세운 로직은 다음과 같았다:

- 최상위 컴포넌트인 `ChatBox`에서 STOMP 클라이언트를 생성하고 연결과 관련된 설정을 진행
- 채팅 메시지를 전송해야 하는 `Footer`는 `ChatBox`로 부터 `Client` 객체를 props로 받아 사용할 것
- 채팅 메시지를 수신해야 하는 `Body`는 `ChatBox`로 부터 `Client` 객체를 props로 받아 사용할 것

## 첫 번째 시도: 객체를 직접 선언하여 설정

공식 가이드를 따라하다보니 자연스레 `Client` 객체를 `ChatBox` 함수의 프로퍼티로 선언하여 사용하게 되었다:

```tsx
/* ChatBox.tsx */
function ChatBox() {
	const client = new Client(STOMP_CONFIG);
	...
	useEffect(() => {
		// client 객체에 대한 설정 및 연결 시도
	}, [])
	return (
		...
		<Body client={client} />
		<Footer client={client} />
		...
	)
}
```

모든 컴포넌트를 다 끌어오게되면 복잡하므로 문제가 되는 부분만 가져와서 다음과 같이 추상화 하였다(`ChatBox`는 `Parent`로 대응시켰고, `Body`와 `Footer`는 `Child`로 대응시켰다):

```tsx
/* Parent.tsx */
function Parent() {
  const [toggle, setToggle] = useState(false);  // Parent를 재렌더링 하기 위한 state
  const obj = {      // 1.Parent의 client 객체 생성
    name: "tico",
    age: 0
  }

  useEffect(() => {  // 2.Parent의 useEffect가 실행되어 obj.age = 15로 세팅
    obj.age = 15;
    console.log("Parent.tsx:", obj);  // "name: tico, age: 15"
  }, [])

  return (
    <div>
      <Child obj={obj}/>  {/* 3.Child의 props로 세팅된 obj를 넘겨줌 */}
      <button onClick={() => setToggle(!toggle)}>state 변화해서 부모 재렌더링하기</button>
    </div>
  )
}
```

```tsx
/* Child.tsx */
function Child({obj}: ChildProps) {
  useEffect(() => {  // 5.Child의 useEffect가 실행됨
    console.log("Child.tsx:", obj);  // "Child.tsx: {name: "tico", age: 0}"
  }, [])

	// 4.Child는 넘겨받은 obj를 렌더링 함
  return (
    <div>
      <p>obj.name: {obj.name}</p>
      <p>obj.age: {obj.age}</p>
      <button onClick={() => console.log("Child에서 본 obj:", obj)}>Child에서 obj 확인하기</button>
    </div>
  )
}
```

위의 코드가 가진 의도는 다음과 같다:

1. `Parent`의 `obj` 객체 생성
2. `Parent`의 `useEffect`가 실행되어 `obj.age = 15`로 세팅
3. `Child`의 props로 세팅된 `obj`를 넘겨줌
4. `Child`는 넘겨받은 `obj`를 렌더링 함
5. `Child`의 `useEffect`가 실행됨

하지만 실제로는 다음과 같이 동작하였다:

1. `Parent`의 `obj` 객체 생성
2. `**Child`의 props로 세팅된 `obj`를 넘겨줌**
3. `Child`는 넘겨받은 `obj`를 렌더링 함
4. `Child`의 `useEffect`가 실행됨
5. `**Parent`의 `useEffect`가 실행되어 `obj.age = 15`로 세팅**

즉, 2번과 5번의 동작 순서를 완전히 반대로 생각했던 것이다! 그래서 다음과 같이 `**Child`는 `age`가 세팅되지 못한 값을 렌더링 하는 첫 번째 문제점**이 발생 되었다:

![Untitled](https://user-images.githubusercontent.com/96981852/228618106-d3175361-2b97-44ab-81c4-1755b03c3862.png)

이것만이 끝이 아니었다. **두 번째 문제점은** `**Parent` 컴포넌트가 재렌더링 될 때마다 `obj`가 초기화 된다는 것**이었다. 왜냐하면 컴포넌트의 재렌더링은 곧 해당 컴포넌트의 재실행을 의미했기에, 기껏 세팅해놓은 obj가 매번 초기화 되는 문제점이 발생하였다. 이를 해결하기 위해서는 일반적인 함수 프로퍼티로 선언해서는 안된다는 것을 캐치해내게 되었다

## 두 번째 시도: useState 사용하기

삽질했던 구간이다. `obj`를 `useState` hook을 사용하여 정의한 것이다:

```tsx
/* Parent.tsx */
function Parent() {
	const [obj, setObj] = useState({name: "tico", age: 0});
	...
}
```

확실한건 두 번째 문제점이 해결되었다는 것이다. 이제 부모가 재렌더링 되더라도 `obj`는 완전 초기화 되지는 않는다

하지만 `useState`는 `obj`의 프로퍼티가 변화하는 것을 감지해내지는 못했기 때문에, `Parent`나 `Child`를 강제로 재렌더링 하지 않는이상 `Child`는 업데이트된 `obj`를 반영하여 렌더링 하지 못하였다. 첫 번째 문제점이 해결되지 못한 것이다!(물론 원래의 프로젝트에선 `Parent`에 해당하는 `ChatBox`가 무조건 한 번은 재렌더링 되었기에 여기서 만족하고 그만할까 고민도 하였다)

[리액트 공식 가이드](https://react.dev/learn/updating-objects-in-state)를 따라 객체의 프로퍼티를 변경할때 그냥 변경하는 것이 아니라 `setObj`와 같은 set state 함수를 사용하여 변경하면 이 문제가 해결되었지만 실제 프로젝트에서는 적용할 수 없었다. 왜냐하면 obj보다 훨씬더 복잡한 객체인 `client`를 복사하여 새로운 `client`를 만드는 순간 기존의 연결이 끊어졌기 때문이다

`useMemo`나 `useCallback` hook을 사용하여 해결하는 방법도 고민하였으나, `obj`는 캐싱되어 관리될 값이 아니었기에 이 hook들의 side-effect를 사용하지 않는 찝찝함은 여전했다. 즉, `useState` 대신에 이 hook들을 사용해야만 하는 정당한 이유를 찾지 못하였다

## 해결법: useState와 useRef 사용하기

결국 나는 각각의 문제점을 해결하기 위해 두 개의 hook을 사용하기로 하였다:

- 어차피 `useState`는 `obj`의 값 변화를 감지할 수 없으므로 `obj`는 `useRef` hook으로 정의한다. 이렇게 하면 원본 obj를 유지하면서 재레더링 시에도 값을 잃지 않게 된다
- 렌더링에만 관여하는 상태에 대해선 `useState`로 정의한다

```tsx
/* Parent.tsx */
function Parent() {
  const [toggle, setToggle] = useState(false);  // Parent를 재렌더링 하기 위한 state
  const objRef = useRef({name: "tico", age: 0})

  useEffect(() => {
    const obj = objRef.current;
    obj.age = 15;
    setToggle(!toggle);  // obj.age = 15로 세팅하였으므로 재렌더링을 위해 state를 변경한다
  }, [])
	...
}
```

물론 완벽한 해결 방법은 아니다. `useState` 하나로 해결할 수 있는 동작을 두 개로 나누어 정의한 것은 유지보수성에 심각한 영향을 미치게 된다. 이제 렌더링 상태를 결정해야 하는 모든 곳에다 set state 함수를 사용해야만 한다

그래서 더 좋은 방법을 찾기 위해 노력 중이다… 언젠가는 아주 우아한 해결방법을 찾겠지??