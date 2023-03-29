import React, { useEffect, useRef, useState } from 'react'
import Child from './Child'

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

  const ageUP = () => {
    obj.age += 1;
  }

  return (
    <div>
      <Child obj={obj}/>  {/* 3.Child의 props로 세팅된 obj를 넘겨줌 */}
      <button onClick={() => setToggle(!toggle)}>state 변화해서 부모 재렌더링하기</button>
      <button onClick={ageUP}>age증가</button>
    </div>
  )
}

export default Parent