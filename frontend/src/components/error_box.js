import { Alert } from "react-bootstrap";

function ErrorBox({title, error, onClose}) {
    console.error(error);

    return (
        <Alert dismissible variant="danger" onClose={onClose}>
            <b><i className="bi bi-bug-fill"></i> &nbsp; {title}</b> &nbsp; {error.message}
        </Alert>);
}

export default ErrorBox;