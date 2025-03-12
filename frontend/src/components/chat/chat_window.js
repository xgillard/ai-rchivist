import { useCallback, useEffect, useRef, useState } from "react";
import ChatMessage from "./chat_message";
import classes from "./chat_window.module.css"
import { createPortal } from "react-dom";
import ErrorBox from "../error_box";
import { CloseButton } from "react-bootstrap";

/**
 * This component is a bit tricky to follow: it basically consists of the component that 
 * displays the chatbox. It deals with all llm interactions.
 * 
 * @param {conversation} the list of messsages that are to be displayed in the chat conversation
 * @param {model} the name of the llm model to use when interacting with the llm
 * @param {set_conversation} the callback function to execute when one wants to update the conversation
 * @param {set_metadata} a callback that lets the chatbox drive the data for all the rest of the interface
 * @param {minimize} a callback function to execute whenever the chatbox is to be minimized 
 * @returns the jsx (virtualdom) content necessary to display the chatbox
 */
function ChatWindow({conversation, model, set_conversation, set_metadata, minimize}) {
    const [isLoading, set_loading] = useState(false); // this is used to show the "typing" dots as we are waiting for an update
    const [usertext, set_usertext] = useState("");    // this is the text typed by the user in the chatbox
    const [errormsg, set_errormsg] = useState(null);  // this is the potential error message gotten upon an erroneous interaction
    // in order to be userfriendly, we want to make sure that the chatbox always displays the latest messages that have 
    // been exchanged. In order to do that, we need to have a means to interact directly with the chatbox frame in the browser
    // this is what this ref is used for. It is used in combination with a later effect, so as to always scroll the chatbox to
    // the bottom whenever a new message is exchanged.
    const chatboxRef = useRef();

    // This callback is executed to conduct a round of talk with the llm: 
    // it sends the conversation (with the suffix user message) to the target model llm. 
    // Then, when an answer is received, the data contained in that response is set to the
    // global user interface, conversation is updated, and the typing dots disappear.
    // Upon error, an error message should be shown.
    const get_llm_response = useCallback(function(user_message) {
        set_conversation((convers) => [...convers, user_message]);
        set_loading(true);

        const chat_request = {
            model: model,
            conversation: [...conversation, user_message]
        };

        fetch(`${process.env.REACT_APP_API_URL}/chat`, 
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
                body: JSON.stringify(chat_request)
            })
            .then(resonse => {
                if (resonse.ok) {
                    return resonse.json();
                } else {
                    throw new Error("Bad response")
                }
            })
            .then(llm_message => {
                set_conversation((convers) => {
                    const updated = convers.filter(msg => msg !== user_message);
                    return [...updated, user_message, llm_message];
                });
                set_metadata((_meta) => JSON.parse(llm_message.content))
            })
            .catch(err => set_errormsg(err))
            .finally(() => set_loading(false));
    }, [conversation, model, set_conversation, set_metadata, set_loading])

    // The goal of this simple function is to call handle the default behavior for a form submit
    // and make sure the user input text is reset while an interaction with the llm is triggered.
    function send_message(event) {
        event.preventDefault();
        get_llm_response({ role: "user", content: usertext });
        set_usertext("");
    }

    // just to make sure the chat is always scrolled to the bottom
    useEffect(() => {
        if (chatboxRef.current) {
            chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
        }
    }, [conversation]);

    return (<>
        <div className={classes.ChatWindow}>
            <div className={classes.ChatWindowHeader}>
                <span className={classes.ChatWindowTitle}><i className="bi bi-chat-text-fill"></i> Ask Improvements </span>
                <CloseButton  onClick={() => minimize()} />
            </div>
            <div className={classes.ChatWindowBody} ref={chatboxRef}>
                {conversation && conversation.slice(2).map((msg, i) => <ChatMessage key={`msg_${i}`} role={msg.role} content={msg.content} set_metadata={set_metadata} />)}
                {isLoading    && <ChatMessage key="loading" role="__loading__" content="" /> }
            </div>
            <div className={classes.ChatWindowFooter}>
                <form onSubmit={send_message}>
                    <div className="input-group">
                        <input type="text" className="form-control" placeholder="Type your message..." value={usertext} onChange={(e) => set_usertext(e.target.value)}/>
                        <button className="btn btn-primary" type="submit">Send</button>
                    </div>
                </form>
            </div>
        </div>
        {(errormsg && createPortal(<ErrorBox title="Chat" error={errormsg} onClose={_ => set_errormsg(null)}/>, document.getElementById("error-panel")))}
        </>);
}

export default ChatWindow;