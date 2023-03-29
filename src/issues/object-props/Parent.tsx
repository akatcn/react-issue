import React, { useEffect, useRef, useState } from 'react'
import Child from './Child'

function Parent() {
  const [toggle, setToggle] = useState(false);  // Parent를 재렌더링 하기 위한 state
  const objRef = useRef({name: "tico", age: 0})

  useEffect(() => {
    const obj = objRef.current;
    obj.age = 15;
    setToggle(!toggle);  // obj.age = 15로 세팅하였으므로 재렌더링을 위해 state를 변경한다
  }, [])

  const ageUP = () => {
    const obj = objRef.current;
    obj.age += 1;
    setToggle(!toggle);
  }

  return (
    <div>
      <Child obj={objRef.current}/>
      <button onClick={() => setToggle(!toggle)}>state 변화해서 부모 재렌더링하기</button>
      <button onClick={ageUP}>age증가</button>
    </div>
  )
}

export default Parent