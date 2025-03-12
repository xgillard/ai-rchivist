import classes from "./waiting_dots.module.css"

function WaitingDots() {
    return (
        <div className={classes.WaitingDots}>
            <span className={classes.Dot}></span>
            <span className={classes.Dot}></span>
            <span className={classes.Dot}></span>
        </div>);
}

export default WaitingDots;