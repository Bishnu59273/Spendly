import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

export default function EmojiPicker({ onChange }) {
  return (
    <div style={{ borderRadius: "var(--r-sm)", overflow: "hidden", width: "100%" }}>
      <Picker
        data={data}
        onEmojiSelect={(emoji) => onChange(emoji.native)}
        theme="auto"
        previewPosition="none"
        skinTonePosition="none"
        dynamicWidth
      />
    </div>
  );
}
