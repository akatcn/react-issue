import React, { useEffect } from 'react'
type ChildProps = {
  obj: {
    name: string,
    age: number
  }
}

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

export default Child