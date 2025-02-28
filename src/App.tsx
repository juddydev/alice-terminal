import { useState } from "react";
import Terminal, { ColorMode, TerminalOutput } from "react-terminal-ui";
import { marked } from "marked";
import "./App.css";

const App = () => {
  const [messages, setMessages] = useState([
    <TerminalOutput key="welcome">Welcome to the Alice Terminal!</TerminalOutput>,
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const agentId = "e0e10e6f-ff2b-0d4c-8011-1fc1eee7cb32";
  const spinnerFrames = ["|", "/", "-", "\\"];

  const showSpinner = (messageKey: string) => {
    let frameIndex = 0;
    const interval = setInterval(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.key === messageKey ? (
            <TerminalOutput key={messageKey}>{spinnerFrames[frameIndex]}</TerminalOutput>
          ) : (
            msg
          )
        )
      );
      frameIndex = (frameIndex + 1) % spinnerFrames.length;
    }, 80); // Spinner speed

    return interval;
  };

  const displayMessage = async (text: string, messageKey: string, isImage = false) => {
    return new Promise<void>((resolve) => {
      let currentText = "";
      const typingInterval = setInterval(() => {
        if (currentText.length < text.length) {
          currentText += text[currentText.length];

          setMessages((prev) =>
            prev.map((msg) =>
              msg.key === messageKey ? (
                <TerminalOutput key={messageKey}>
                  {isImage ? (
                    <img src={text} alt="Response" style={{ maxWidth: "100%", height: "auto" }} />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: marked(currentText) }} />
                  )}
                </TerminalOutput>
              ) : (
                msg
              )
            )
          );
        } else {
          clearInterval(typingInterval);
          resolve();
        }
      }, 20); // Typing speed
    });
  };

  const sendCommand = async (command: string) => {
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);

    setMessages((prev) => [
      ...prev,
      <TerminalOutput key={prev.length + "-input"}>{`>> ${command}`}</TerminalOutput>,
    ]);

    const messageKey = `message-${Date.now()}`;
    setMessages((prev) => [...prev, <TerminalOutput key={messageKey}>|</TerminalOutput>]);

    const spinnerInterval = showSpinner(messageKey); // Start spinner

    try {
      const response = await fetch(`/api/${agentId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: command,
          userId: "user",
          roomId: `default-room-${agentId}`,
        }),
      });

      const data = await response.json();
      clearInterval(spinnerInterval); // Stop spinner

      for (const message of data) {
        const isImage = message.text.startsWith("http") && /\.(png|jpg|jpeg|gif|webp)$/i.test(message.text);
        await displayMessage(message.text, messageKey, isImage); // Show message after spinner stops
      }
    } catch (error) {
      console.error("Error: Failed to connect to server", error);
      clearInterval(spinnerInterval);
      await displayMessage("Error: Failed to connect to server", messageKey);
    }

    setIsProcessing(false);
  };

  return (
    <div className="container">
      <Terminal
        name="Alice Terminal"
        colorMode={ColorMode.Dark}
        onInput={isProcessing ? undefined : (terminalInput) => sendCommand(terminalInput)}
        prompt={isProcessing ? "" : ">> "}
        redBtnCallback={() => console.log("Red button clicked")}
        greenBtnCallback={() => console.log("Green button clicked")}
        yellowBtnCallback={() => console.log("Yellow button clicked")}
      >
        {messages}
      </Terminal>
    </div>
  );
};

export default App;


// Test
// import { useState } from "react";
// import Terminal, { ColorMode, TerminalOutput } from "react-terminal-ui";
// import { marked } from "marked";
// import "./App.css";

// const App = () => {
//   const [messages, setMessages] = useState([
//     <TerminalOutput key="welcome">Welcome to the Alice Terminal!</TerminalOutput>,
//   ]);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const spinnerFrames = ["|", "/", "-", "\\"];

//   const showSpinner = (messageKey: string) => {
//     let frameIndex = 0;
//     const interval = setInterval(() => {
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg.key === messageKey ? (
//             <TerminalOutput key={messageKey}>{spinnerFrames[frameIndex]}</TerminalOutput>
//           ) : (
//             msg
//           )
//         )
//       );
//       frameIndex = (frameIndex + 1) % spinnerFrames.length;
//     }, 80);
//     return interval;
//   };

//   const displayMessage = async (text: string, messageKey: string, isImage = false) => {
//     return new Promise<void>((resolve) => {
//       let currentText = "";
//       const typingInterval = setInterval(() => {
//         if (currentText.length < text.length) {
//           currentText += text[currentText.length];

//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.key === messageKey ? (
//                 <TerminalOutput key={messageKey}>
//                   {isImage ? (
//                     <img src={text} alt="Response" style={{ maxWidth: "100%", height: "auto" }} />
//                   ) : (
//                     <div dangerouslySetInnerHTML={{ __html: marked(currentText) }} />
//                   )}
//                 </TerminalOutput>
//               ) : (
//                 msg
//               )
//             )
//           );
//         } else {
//           clearInterval(typingInterval);
//           resolve();
//         }
//       }, 20);
//     });
//   };

//   const sendCommand = async (command: string) => {
//     if (!command.trim() || isProcessing) return;

//     setIsProcessing(true);

//     setMessages((prev) => [
//       ...prev,
//       <TerminalOutput key={prev.length + "-input"}>{`>> ${command}`}</TerminalOutput>,
//     ]);

//     const messageKey = `message-${Date.now()}`;
//     setMessages((prev) => [...prev, <TerminalOutput key={messageKey}>|</TerminalOutput>]);

//     const spinnerInterval = showSpinner(messageKey);

//     try {
//       // ✅ Mock API Response with Image URL
//       const data = [
//         {
//           text: "https://raw.githubusercontent.com/juddydev/Alice-Image-Generation/main/assets/Alice.png",
//         },
//       ];
      
//       clearInterval(spinnerInterval);

//       for (const message of data) {
//         const isImage = message.text.startsWith("http") && /\.(png|jpg|jpeg|gif|webp)$/i.test(message.text);
//         console.log("Displaying message:", message.text, "Is image?", isImage);
//         await displayMessage(message.text, messageKey, isImage);
//       }
//     } catch (error) {
//       console.error("Error: Failed to connect to server", error);
//       clearInterval(spinnerInterval);
//       await displayMessage("Error: Failed to connect to server", messageKey);
//     }

//     setIsProcessing(false);
//   };

//   return (
//     <div className="container">
//       <Terminal
//         name="Alice Terminal"
//         colorMode={ColorMode.Dark}
//         onInput={isProcessing ? undefined : (terminalInput) => sendCommand(terminalInput)}
//         prompt={isProcessing ? "" : ">> "}
//       >
//         {messages}
//       </Terminal>
//     </div>
//   );
// };

// export default App;