import WaitingDots from '../waiting_dots';
import classes from './chat_message.module.css'

function ChatMessage({role, content, set_metadata}) {
    switch (role) {
        case "assistant":
            const old_data = JSON.parse(content);
            return (<div className={classes.AssistantMessage} onClick={(_) => set_metadata((meta) => ({...meta, ...old_data}))}>
                    A new version of the data has been loaded. 
                    If you made some changes and want to retrieve this version of the data 
                    in the future just click on this message to reload it.
                    </div>);
        case "user":
            return (<div className={classes.UserMessage} >{content}</div>);
        case "__loading__":
            return (<WaitingDots />);
        default:
            return <></>
    }
}

export default ChatMessage;