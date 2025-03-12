import { useState } from "react";
import ChatPill from "./chat_pill";
import ChatWindow from "./chat_window";

function Chat({conversation, model, set_conversation, set_metadata}) {
    const [minimized, set_minimized] = useState(true);

    if (minimized) {
        return <ChatPill onClick={(_) => set_minimized(false)} />
    } else {
        return <ChatWindow conversation={conversation} model={model} set_conversation={set_conversation} set_metadata={set_metadata} minimize={(_) => set_minimized(true)} />
    }
}

export default Chat;