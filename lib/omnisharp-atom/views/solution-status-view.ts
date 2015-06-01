import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {solutionInformation} from "../features/solution-information";

interface ISolutionStatusWindowState {
}

export interface ISolutionStatusWindowProps {
    solutionInformation: typeof solutionInformation;
}

export class SolutionStatusWindow<T extends ISolutionStatusWindowProps> extends ReactClientComponent<T, ISolutionStatusWindowState> {
    public displayName = 'SolutionStatusWindow';

    constructor(props?: T, context?: any) {
        super(props, context);

        //this.model = this.props.codeCheck;
        this.state = {};
    }

    public componentWillMount() {
        super.componentWillMount();
    }

    public componentDidMount() {
        super.componentDidMount();
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
    }

    public render() {
        return React.DOM.div({
            "class": 'package-card col-lg-8'
        }, React.DOM.div({
            "class": 'stats pull-right'
        }, React.DOM.span({
            "class": "stats-item"
        }, React.DOM.span({
            "class": 'icon icon-versions'
        }),
            React.DOM.span({
                //outlet: 'versionValue',
                "class": 'value'
            }, version)
            ),
            React.DOM.span({
                "class": 'stats-item'
            }, React.DOM.span({
                "class": 'icon icon-cloud-download'
            }),
                React.DOM.span({
                    outlet: 'downloadCount',
                    "class": 'value'
                })
                )
            ),
            React.DOM.div({
                "class": 'body'
            },
                React.DOM.h4({
                    "class": 'card-name'
                }, React.DOM.a({
                    outlet: 'packageName'
                }, name)
                    ),
                React.DOM.span({
                    outlet: 'packageDescription',
                    "class": 'package-description'
                }, description),
                React.DOM.div({
                    outlet: 'packageMessage',
                    "class": 'package-message'
                })
                ),
            React.DOM.div({
                "class": 'meta'
            },
                React.DOM.div({
                    "class": 'meta-user'
                },
                    React.DOM.a({
                        outlet: 'avatarLink',
                        href: "https://atom.io/users/" + owner
                    },
                        React.DOM.img({
                            outlet: 'avatar',
                            "class": 'avatar',
                            src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
                        })
                        ),
                    React.DOM.a({
                        outlet: 'loginLink',
                        "class": 'author',
                        href: "https://atom.io/users/" + owner
                    }, owner)
                    ),
                React.DOM.div({
                    "class": 'meta-controls'
                },
                    React.DOM.div({
                        "class": 'btn-group'
                    },
                        React.DOM.button({
                            type: 'button',
                            "class": 'btn btn-info icon icon-cloud-download install-button',
                            outlet: 'installButton'
                        }, 'Install')
                        ),
                    React.DOM.div({
                        outlet: 'buttons',
                        "class": 'btn-group'
                    },
                        React.DOM.button({
                            type: 'button',
                            "class": 'btn icon icon-gear settings',
                            outlet: 'settingsButton'
                        }, 'Settings'),
                        React.DOM.button({
                            type: 'button',
                            "class": 'btn icon icon-trashcan uninstall',
                            outlet: 'uninstallButton'
                        }, 'Uninstall'),
                        React.DOM.button({
                            type: 'button',
                            "class": 'btn icon icon-playback-pause enablement',
                            outlet: 'enablementButton'
                        }, React.DOM.span({
                            "class": 'disable-text'
                        }, 'Disable')
                            ),
                        React.DOM.button({
                            type: 'button',
                            "class": 'btn status-indicator',
                            tabindex: -1,
                            outlet: 'statusIndicator'
                        })
                        )
                    )
                )
            );
    }
}
