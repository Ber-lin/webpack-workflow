import React from "react";
import { useState,useEffect } from "react";

export const App = () => {
  const [color, setColor] = useState("#000");
  const getStyles = (color) => ({
    color,
  });
  useEffect(()=>{
    console.log(getStyles(color))
  },[color])
  const handleClick = () => {
    import("./components/test").then((module) => {
      const print = module.default;
      print();
    });
    setColor("red");
  };
  return (
    <>
      <button onClick={handleClick}>click</button>
      <input type="text" />
      <div style={getStyles(color)}>1111111</div>
    </>
  );
};
