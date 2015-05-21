import $ = require('jquery');
import path = require('path');
var _ = require('lodash');

class NotificationHandler {
    public activate() {
        this.packageRestoreNotification = new PackageRestoreNotification();
        atom.emitter.on('omni-sharp-server:event', (event) => this.handleEvent(event));
    }

    private packageRestoreNotification : PackageRestoreNotification;

    private handleEvent(event) {
        this.packageRestoreNotification.handleEvent(event);
    }

}

class PackageRestoreNotification {
    constructor() {
        this.notification = new OmniNotification();
        this.packageRestoreStarted = 0;
        this.packageRestoreFinished = 0;
        this.knownProjects = [];
    }

    private notification: OmniNotification;
    private packageRestoreStarted: number;
    private packageRestoreFinished: number;
    private knownProjects: Array<string>;

    public handleEvent(event) {
        if (event.Event == 'PackageRestoreStarted') {
            // Count how many of these we get so we know when to dismiss the notification
            this.packageRestoreStarted++;
            if (this.notification.isDismissed()) {
                this.notification.show('Package restore started', "Starting..");
            }
        }

        if (event.Event == 'UnresolvedDependencies') {
            // Sometimes UnresolvedDependencies event is sent before PackageRestoreStarted
            if (this.notification.isDismissed()) {
                this.notification.show('Package restore started', "Starting..");
            }

            var projectName = this.findProjectNameFromFileName(event.Body.FileName);
            // Client gets more than one of each UnresolvedDependencies events for each project
            // Don't show multiple instances of a project in the notification
            if (!_.any(this.knownProjects, (knownProject) => { return  knownProject == projectName })) {
                this.knownProjects.push(projectName);
                this.notification.addDetail(`Unresolved dependencies for ${projectName}:`, true);
                if (event.Body.UnresolvedDependencies) {
                    event.Body.UnresolvedDependencies.forEach(dep => {
                        this.notification.addDetail(` - ${dep.Name} ${dep.Version}`);
                    });
                }
            }
        }

        if(event.Event === 'log' && event.Body && event.Body.Message && event.Body.Name) {
            if(event.Body.Name === 'OmniSharp.AspNet5.PackagesRestoreTool' && event.Body.Message.startsWith('Installing')) {
                this.setPackageInstalled(event.Body.Message);
            }
        }

        if (event.Event == 'PackageRestoreFinished') {
            // Count how many of these we get so we know when to dismiss the notification
            this.packageRestoreFinished++;
            if(this.packageRestoreStarted === this.packageRestoreFinished){
                this.notification.setSuccessfulAndDismiss('Package restore finished.');
                this.packageRestoreStarted = 0;
                this.packageRestoreFinished = 0;
                this.knownProjects = [];
            }
        }
    }

    private findProjectNameFromFileName(fileName: string): string {
        var split = fileName.split(path.sep);
        var projectName = split[split.length - 2];
        return projectName;
    }

    private setPackageInstalled(message: string) {
        var match = message.match(/Installing ([a-zA-Z.]*) ([\D?\d?.?-?]*)/);
        var detailLines = this.notification.getDetailElement().children('.line');
        if(!match || match.length < 3) return;
        _.forEach(detailLines, line => {
            if(line.textContent.startsWith(` - ${match[1]} `)) {
                line.textContent = `Installed ${match[1]} ${match[2]}`;
            }
        });
    }
}

class OmniNotification {
    constructor() {
        this.dismissed = true;
    }

    private atomNotification : Atom.Notification;
    private dismissed: boolean;
    private isBeingDismissed: boolean;

    public addDetail(detail: string, newline?: boolean) {
        var details = this.getDetailElement();
        if(!detail) return;
        if(newline) details.append('<br />')
        details.append(`<div class="line">${detail}</div>`);
    }

    public show(message: string, detail: string) {
        this.atomNotification = atom.notifications.addInfo(message, { detail: detail, dismissable: true});
        this.dismissed = false;
        this.atomNotification.onDidDismiss(notification => {
            this.dismissed = true;
            this.isBeingDismissed = false;
        });
    }

    public setSuccessfulAndDismiss(message: string) {
        if(this.isBeingDismissed) return;
        this.addDetail(message, true);
        var domNotification = $(atom.views.getView(this.atomNotification));
        domNotification.removeClass('info');
        domNotification.removeClass('icon-info');
        domNotification.addClass('success');
        domNotification.addClass('icon-check');
        this.isBeingDismissed = true;
        setTimeout(() => { this.dismiss(); }, 2000);
    }

    public isDismissed(): boolean {
        return this.dismissed;
    }

    private dismiss() {
        this.atomNotification.dismiss();
    }

    public getDetailElement() : JQuery {
        return this.getFromDom($(atom.views.getView(this.atomNotification)), '.content .detail .detail-content');
    }

    private getFromDom(element: JQuery, selector: string): JQuery {
        var el = element[0];
        if(!el) return;
        var found = (<any> el).querySelectorAll(selector);
        return $(found[0]);
    }
}

export =  NotificationHandler
