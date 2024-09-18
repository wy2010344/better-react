import { dom, renderText } from "better-react-dom";
import { menubar, menubarItem, menubarSeparator, menubarShortcut, renderMenubar, renderMenubarIcon, renderMenuberSub, useMenubar } from "../components/menubar";
import { cn } from "@/utils";
import { renderCheckIcon, renderDotFilledIcon } from "../components/icons";
import { renderPage } from "@/demo/util/page";

function renderSeparator() {

  dom.div({
    className: menubarSeparator
  }).render()
}
export default function () {
  renderPage({
    title: "menubar",
  }, () => {

    useMenubar()
    dom.div({ className: menubar }).render(() => {
      renderMenubar({
        renderTrigger(props) {
          return dom.button(props).renderText`File`
        },
        renderContent(props) {
          dom.div(props).render(() => {
            dom.div({
              className: menubarItem()
            }).render(() => {
              renderText`New Tab`
              dom.span({
                className: menubarShortcut
              }).renderText`⌘T`
            })

            dom.div({
              className: menubarItem()
            }).render(() => {
              renderText`New Window`
              dom.span({
                className: menubarShortcut
              }).renderText`⌘N`
            })

            dom.div({
              className: menubarItem({ disabled: true })
            }).renderText`New Incognito Window`

            dom.div({
              className: menubarSeparator
            }).render()

            renderMenuberSub({
              renderTrigger(props, renderIcon) {
                return dom.div(props).render(() => {
                  renderText`Share`
                  renderIcon()
                })
              },
              renderContent(props) {
                dom.div(props).render(() => {
                  dom.div({
                    className: menubarItem()
                  }).renderText`Email Link`
                  dom.div({
                    className: menubarItem()
                  }).renderText`Messages`
                  dom.div({
                    className: menubarItem()
                  }).renderText`Notes`
                })
              },
            })

            dom.div({
              className: menubarSeparator
            }).render()

            dom.div({
              className: menubarItem()
            }).render(() => {
              renderText`Print...`
              dom.span({
                className: menubarShortcut
              }).renderText`⌘P`
            })
          })
        }
      })

      renderMenubar({
        renderTrigger(props) {
          return dom.button(props).renderText`Edit`
        },
        renderContent(props) {
          dom.div(props).render(() => {
            dom.div({
              className: menubarItem()
            }).render(() => {
              renderText`Undo`
              dom.span({
                className: menubarShortcut
              }).renderText`⌘Z`
            })

            dom.div({
              className: menubarItem()
            }).render(() => {
              renderText`Redo`
              dom.span({
                className: menubarShortcut
              }).renderText`⇧⌘Z`
            })

            renderSeparator()

            renderMenuberSub({
              renderTrigger(props, renderIcon) {
                return dom.div(props).render(() => {
                  renderText`Share`
                  renderIcon()
                })
              },
              renderContent(props) {
                dom.div(props).render(() => {
                  dom.div({
                    className: menubarItem()
                  }).renderText`Search the web`
                  renderSeparator()
                  dom.div({
                    className: menubarItem()
                  }).renderText`Find...`
                  dom.div({
                    className: menubarItem()
                  }).renderText`Find Next`
                  dom.div({
                    className: menubarItem()
                  }).renderText`Find Previous`
                })
              },
            })

            renderSeparator()

            dom.div({
              className: menubarItem()
            }).renderText`Cut`
            dom.div({
              className: menubarItem()
            }).renderText`Copy`
            dom.div({
              className: menubarItem()
            }).renderText`Paste`
          })
        },
      })

      renderMenubar({
        renderTrigger(props) {
          return dom.button(props).renderText`View`
        },
        renderContent(props) {
          dom.div(props).render(() => {
            dom.div({
              className: menubarItem({ inset: true })
            }).render(() => {
              renderMenubarIcon({
                render: renderCheckIcon
              })
              renderText`Always Show Bookmarks Bar`
            })

            dom.div({
              className: menubarItem({ inset: true })
            }).render(() => {
              renderMenubarIcon({
                checked: true,
                render: renderCheckIcon
              })
              renderText`Always Show Full URLs`
            })

            renderSeparator()

            dom.div({
              className: menubarItem({ inset: true })
            }).render(() => {
              renderText`Reload`
              dom.span({
                className: menubarShortcut
              }).renderText`⌘R`
            })
            dom.div({
              className: menubarItem({ inset: true, disabled: true })
            }).render(() => {
              renderText`Force Reload`
              dom.span({
                className: menubarShortcut
              }).renderText`⇧⌘R`
            })
            renderSeparator()

            dom.div({
              className: menubarItem({ inset: true })
            }).renderText`Toggle Fullscreen`
            renderSeparator()
            dom.div({
              className: menubarItem({ inset: true })
            }).renderText`Hide Sidebar`
          })
        },
      })


      renderMenubar({
        renderTrigger(props) {
          return dom.button(props).renderText`Profiles`
        },
        renderContent(props) {
          dom.div(props).render(() => {
            dom.div({
              className: menubarItem({ inset: true })
            }).render(() => {
              renderMenubarIcon({
                render: renderDotFilledIcon
              })
              renderText`Andyr`
            })
            dom.div({
              className: menubarItem({ inset: true })
            }).render(() => {
              renderMenubarIcon({
                checked: true,
                render: renderDotFilledIcon
              })
              renderText`Benoit`
            })

            dom.div({
              className: menubarItem({ inset: true })
            }).render(() => {
              renderMenubarIcon({
                render: renderDotFilledIcon
              })
              renderText`Luis`
            })

            renderSeparator()
            dom.div({
              className: menubarItem({ inset: true })
            }).renderText`Edit...`
            renderSeparator()
            dom.div({
              className: menubarItem({ inset: true })
            }).renderText`Add Profile`
          })
        },
      })

    })
  })
}