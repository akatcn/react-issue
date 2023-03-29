import React, { useState } from 'react'

type ChildProps = {
  setParentNum: React.Dispatch<React.SetStateAction<number>>
}

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

export default Child