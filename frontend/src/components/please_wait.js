import WaitingDots from './waiting_dots';
import classes from './please_wait.module.css'

function PleaseWait() {
    return (
        <>
        <div className={classes.ScreenLock}></div>
        <div className={classes.WaitPopupBox}>
            <span className={classes.WaitMessage}>Please wait </span>
            <WaitingDots />
        </div>
        </>);
}

export default PleaseWait;