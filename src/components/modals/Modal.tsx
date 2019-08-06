import * as React from "react";
import dict from "../../lang";
import Button from "../widgets/Button";
import keyCode from "../../enums/keyCode";

const CommonTStr = dict.CommonTStr;

type ModalProps = {
    id: string;
    header: string;
    instruct: string;
    display: boolean;
    children: any;
    confirm: {
        text?: string,
        disabled?: boolean,
        callback: any
    },
    close: {
        text?: string,
        callback: any
    },
    style: any;
    className?: string;
    options?: {
        locked?: boolean
        verticalQuartile?: boolean
    };
}

type ModalState = {
    isFullScreen: boolean;
};

export default class Modal extends React.Component<ModalProps, ModalState> {
    _confirmRef: React.RefObject<HTMLButtonElement>;
    _closeRef: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);
        this._handleConfirm = this._handleConfirm.bind(this);
        this._handleKeyboardEvent = this._handleKeyboardEvent.bind(this);
        this._confirmRef = React.createRef();
        this._closeRef = React.createRef();
        this.state = {
            isFullScreen: false
        };
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.display && this.props.display) {
            // when show
            document.addEventListener("keydown", this._handleKeyboardEvent);
        } else if (prevProps.display && !this.props.display) {
            // when hide
            document.removeEventListener("keydown", this._handleKeyboardEvent);
        }
    }

    render() {
        if (!this.props.display) {
            return null;
        }

        let { id, className, header, instruct,
            children, close, confirm, options } = this.props;
        options = options || {};
        // XXX remove window hack
        let gMinModeOn: boolean = typeof window !== "undefined" && window["gMinModeOn"];
        let modalClassNames = ["modalContainer"];
        if (className) {
            modalClassNames.push(className);
        }

        let modalBgClassNames = ["modalBackground"];
        if (options.locked) {
            modalBgClassNames.push("locked");
        }

        if (!gMinModeOn) {
            modalClassNames.push("anim");
            modalBgClassNames.push("anim");
        }

        return (
            <React.Fragment>
                <div
                    id={id}
                    className={modalClassNames.join(" ")}
                    style={this._getStyle()}
                >
                    <header className="modalHeader">
                        <span className="text">{header}</span>
                        <div
                            className="headerBtn exitFullScreen"
                            data-toggle="tooltip"
                            data-container="body"
                            data-placement="top auto"
                            data-tipclasses="highZindex"
                            data-original-title={CommonTStr.Minimize}
                            onClick={() => this._exitFullScreen()}
                        >
                            <i className="icon xi-exit-fullscreen"></i>
                        </div>
                        <div
                            className="headerBtn fullScreen"
                            data-toggle="tooltip"
                            data-container="body"
                            data-placement="top auto"
                            data-tipclasses="highZindex" 
                            data-original-title={CommonTStr.Maximize}
                            onClick={() => this._enterFullScreen()}
                        >
                            <i className="icon xi-fullscreen"></i>
                        </div>
                        <div
                            className="close"
                            onClick={close.callback}
                            ref={this._closeRef}
                        >
                            <i className="icon xi-close"></i>
                        </div>
                    </header>
                    <section className="modalInstruction oneLine">
                        <i className="icon xi-info-circle"></i>
                        <div className="text">{instruct}</div>
                    </section>
                    <section className="modalMain">
                        {children}
                    </section>
                    <section className="modalBottom">
                        <Button
                            className={"confirm" + (confirm.disabled ? " xc-disabled" : "")}
                            onClick={this._handleConfirm}
                            ref={this._confirmRef}
                        >
                            {confirm.text || CommonTStr.Confirm}
                        </Button>
                        <Button
                            className="cancel"
                            onClick={close.callback}
                        >
                            {close.text || CommonTStr.Close}
                        </Button>
                    </section>
                </div>
                <div className={modalBgClassNames.join(" ")} style={{display: "block"}}></div>
            </React.Fragment>
        );
    }

    private _getStyle() {
        let { style } = this.props;
        return {
            ...style,
            ...this._center(),
            display: style.display || "block"
        };
    }

    private _center(): {left: number, top: number, width: number, height: number} {
        let {width, height} = this.props.style;
        let width_num: number = parseFloat(width);
        let height_num: number = parseFloat(height);
        let left: number;
        let top: number;

        if (this.state.isFullScreen) {
            width_num = window.innerWidth - 14;
            height_num = window.innerHeight - 9;
            top = 0;
            left = Math.round((window.innerWidth - width_num) / 2);
            return {left, top, width: width_num, height: height_num};
        } else if (isNaN(width_num) || isNaN(height_num)) {
            return {left: undefined, top: undefined, width, height};
        } else {
            left = (window.innerWidth - width_num) / 2;
            let options = this.props.options || {};
            if (options.verticalQuartile) {
                top = (window.innerHeight - height_num) / 4;
            } else {
                top = (window.innerHeight - height_num) / 2;
            }
            return {left, top, width: width_num, height: height_num};
        }
    }

    private _handleConfirm() {
        this._confirmRef.current.blur();
        this.props.confirm.callback();
    }

    private _handleKeyboardEvent(event) {
        if (event.which === keyCode.Escape) {
            this._closeRef.current.click();
            return false;
        }
    }

    private _enterFullScreen() {
        this.setState({isFullScreen: true});
    }

    private _exitFullScreen() {
        this.setState({isFullScreen: false});
    }
}