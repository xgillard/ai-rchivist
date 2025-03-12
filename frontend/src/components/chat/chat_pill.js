import classes from "./chat_pill.module.css"

function ChatPill({onClick}) {
    return (<button type="button" className={classes.ChatPill} onClick={onClick}>
                <i className="bi bi-chat-text-fill"></i>
            </button>);
}

export default ChatPill;