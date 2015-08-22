import {ReplaySubject} from "rx";

export function createToggleableObservable(feature: OmniSharp.IToggleFeature, config: string) {
    var subject = new ReplaySubject<boolean>(1);
    var loaded = false;
    atom.config.observe(config, (enabled: boolean) => {
        feature.enabled = enabled;
        subject.onNext(enabled);

        if (loaded) {
            if (enabled) {
                feature.activate();
            } else {
                feature.dispose();
            }
        }
        if (!loaded) {
            loaded = true;
        }
    });

    return { enabled: subject.asObservable() };
}
