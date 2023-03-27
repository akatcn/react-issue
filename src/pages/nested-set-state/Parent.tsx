import React, { useState } from 'react'
import Child from './Child';

function Parent() {
  const [parentNum, setParentNum] = useState(0);
  return (
    <div>
      <p>parentNum: {parentNum}</p>
      <Child setParentNum={setParentNum} />
    </div>
  )
}
export default Parent