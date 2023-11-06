import { renderContent, useDom } from "better-react-dom";
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
    style: `
    padding:20px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    `,
    children() {

      useDom("div", {
        style: `
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
          renderContent('Click me to toggle the popup!')
          useDom("br")
          renderContent('Click me to toggle the popup!')
          useDom("div", {
            className: 'popup',
            style: `
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
              renderContent('A Simple Popup!')
            },
          })
        },
      })
    },
  })


  useDom("div", {
    style: `
    padding:20px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    `,
    children() {

      useDom("div", {
        style: `
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
            style: `
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
              renderContent('A Simple Popup!')
            },
          })
          useDom("div", {
            style: ` 
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