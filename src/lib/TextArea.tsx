import React, { useRef, useEffect, useState, ChangeEventHandler } from 'react';

interface TextAreaProps {
  cursorPosition: number;
  onCursorPositionChange: (newPosition: number) => void;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  value: string;
}

export default function TextArea({ cursorPosition, onCursorPositionChange, onChange, value }: TextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Set the cursor position using selectionStart and selectionEnd
      textareaRef.current.selectionStart = cursorPosition;
      textareaRef.current.selectionEnd = cursorPosition;
    }
  }, [cursorPosition]);

  const handleCursorPosition = () => {
    if (textareaRef.current) {
      const newPosition = textareaRef.current.selectionStart || 0;
      onCursorPositionChange(newPosition); // Pass the cursor position to the parent
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.addEventListener('click', handleCursorPosition);
      textareaRef.current.addEventListener('keyup', handleCursorPosition);
    }

    return () => {
      if (textareaRef.current) {
        textareaRef.current.removeEventListener('click', handleCursorPosition);
        textareaRef.current.removeEventListener('keyup', handleCursorPosition);
      }
    };
  }, []);

  return (
    <div>
      <textarea
        ref={textareaRef}
        onChange={onChange}
        value={value}
      />
    </div>
  );
}

function ParentComponent() {
  const [cursorPosition, setCursorPosition] = useState<number>(5); // Set an initial cursor position

  const handleCursorPositionChange = (newPosition: number) => {
    setCursorPosition(newPosition);
  };

  // Function to set the cursor position to a specific value
  const setCursorToSpecificValue = () => {
    const specificCursorPosition = 10; // Set your desired cursor position here
    setCursorPosition(specificCursorPosition);
  };

  return (
    <div>
      <h1>Cursor Position in Parent Component: {cursorPosition}</h1>
      <button onClick={setCursorToSpecificValue}>Set Cursor to 10</button>
      <TextArea
        cursorPosition={cursorPosition}
        onCursorPositionChange={handleCursorPositionChange}
        onChange={() => {}}
        />
    </div>
  );
}
