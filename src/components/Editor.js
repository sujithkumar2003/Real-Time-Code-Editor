import React, { useEffect, useRef } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/css/css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/hint/html-hint";
import "codemirror/addon/hint/css-hint";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/show-hint";

import ACTIONS from "../Actions";

const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const editorRef = useRef(null);
  useEffect(() => {
    async function init() {
      editorRef.current = Codemirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: {
            name: "htmlmixed",
            json: true,
          },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
          matchBrackets: true,
          extraKeys: { "Ctrl-Space": "autocomplete" },
          hintOptions: {
            completeSingle: false,
          },
        }
      );

      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });

      editorRef.current.on("inputRead", function (cm, change) {
        if (
          change.text.length === 1 &&
          /^[a-zA-Z0-9_-]$/.test(change.text[0]) &&
          !cm.state.completionActive
        ) {
          cm.showHint();
        } else if (change.text[0] === "!") {
          cm.setValue(
            `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My HTML Page</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <script src="script.js"></script>\n</body>\n</html>`
          );
          cm.setCursor({ line: 5, ch: 2 });
        }
      });

      editorRef.current.on("keyup", function (cm, event) {
        if (event.key === ".") {
          cm.showHint();
        }
      });
    }
    init();
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });
    }

    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]);

  return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
