import { useContent, useDom } from "better-react-dom";
import { normalPanel } from "./panel/PanelContext";

export default normalPanel(function (operate, id) {


  const input = useDom("input", {
    onInput(event) {
      //看来react的input是这样实现的
      console.log(input.value)
      input.value = ''
    }
  })


  useDom("div", {
    css: `
    padding:20px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    `,
    children() {

      useDom("div", {
        css: `
        position: relative;
        display: inline-block;
        cursor: pointer;
        user-select: none;
        >.popup{
          visibility: hidden;
        }
        &:hover{
          >.popup{
            visibility:visible;
          }
        }
        `,
        children() {
          useContent('Click me to toggle the popup!')
          useDom("br")
          useContent('Click me to toggle the popup!')
          useDom("div", {
            className: 'popup',
            css: `
              width: 160px;
              background-color: #555;
              color: #fff;
              text-align: center;
              border-radius: 6px;
              padding: 8px 0;
              position: absolute;
              z-index: 1;
              bottom: 125%;
              left: 50%;
              margin-left: -80px;
              animation: fadeIn 1s;
              &:after{
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: #555 transparent transparent transparent;
              }
            `,
            children() {
              useContent('A Simple Popup!')
            },
          })
        },
      })
    },
  })


  useDom("div", {
    css: `
    padding:20px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    `,
    children() {

      useDom("div", {
        css: `
        position: relative;
        display: inline-flex;
        flex-direction:column;
        cursor: pointer;
        user-select: none;
        >.popup{
          visibility: hidden;
        }
        &:hover{
          >.popup{
            visibility:visible;
          }
        }
        `,
        children() {
          useDom("div", {
            className: 'popup',
            css: `
              width: 160px;
              background-color: #555;
              color: #fff;
              text-align: center;
              border-radius: 6px;
              padding: 8px 0;
              position: absolute;
              z-index: 1;
              // bottom: 125%;
              // left: 50%;
              // margin-left: -80px;
              animation: fadeIn 1s;
              &:after{
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: #555 transparent transparent transparent;
              }
            `,
            children() {
              useContent('A Simple Popup!')
            },
          })
          useDom("div", {
            css: ` 
            width:20px;
            height:20px;
            background:green;
            `
          })
        },
      })
    },
  })
})