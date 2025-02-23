import { useState } from "react";
import Terminal, { ColorMode, TerminalOutput } from "react-terminal-ui";
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

  const displayMessage = async (text: string, messageKey: string) => {
    return new Promise<void>((resolve) => {
      let currentText = "";
      const typingInterval = setInterval(() => {
        if (currentText.length < text.length) {
          currentText += text[currentText.length];
          setMessages((prev) =>
            prev.map((msg) =>
              msg.key === messageKey ? (
                <TerminalOutput key={messageKey}>{currentText}</TerminalOutput>
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
        await displayMessage(message.text, messageKey); // Show message after spinner stops
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
