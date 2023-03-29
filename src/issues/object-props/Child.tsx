import React, { useEffect } from 'react'
type ChildProps = {
  obj: {
    name: string,
    age: number
  }
}

function Child({obj}: ChildProps) {
  useEffect(() => {
    console.log("Child.tsx:", obj);
  }, [])

  return (
    <div>
      <p>obj.name: {obj.name}</p>
      <p>obj.age: {obj.age}</p>
      <button onClick={() => console.log("Child에서 본 obj:", obj)}>Child에서 obj 확인하기</button>
    </div>
  )
}

export default Child