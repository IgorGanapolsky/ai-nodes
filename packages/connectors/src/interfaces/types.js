/**
 * Core types for DePIN node connectors
 */
export class ConnectorError extends Error {
    code;
    details;
    retryable;
    constructor(code, message, details, retryable = false) {
        super(message);
        this.name = 'ConnectorError';
        this.code = code;
        this.details = details;
        this.retryable = retryable;
    }
}
export var ConnectorType;
(function (ConnectorType) {
    ConnectorType["IONET"] = "ionet";
    ConnectorType["NOSANA"] = "nosana";
    ConnectorType["RENDER"] = "render";
    ConnectorType["GRASS"] = "grass";
    ConnectorType["NATIX"] = "natix";
    ConnectorType["HUDDLE01"] = "huddle01";
    ConnectorType["OWNAI"] = "ownai";
})(ConnectorType || (ConnectorType = {}));
