import type {Script} from '@gravity-ui/app-layout';
import isMobile from 'ismobilejs';

import type {ChartkitGlobalSettings} from '../../../shared';
import {DeviceType} from '../../../shared';

export function getPlatform(userAgent: string | undefined) {
    const ua = isMobile(userAgent);

    if (ua.phone) {
        return DeviceType.Phone;
    } else if (ua.tablet) {
        return DeviceType.Tablet;
    }

    return DeviceType.Desktop;
}

type ChartkitLayoutConfig = {
    scripts: Script[];
    inlineScripts: string[];
};

export function getChartkitLayoutSettings(
    chartkitSettings: ChartkitGlobalSettings = {},
): ChartkitLayoutConfig {
    const chartkitScripts = [];
    const chartkitInlineScripts = [];

    if (!chartkitSettings.highcharts?.enabled) {
        chartkitInlineScripts.push(`window.Highcharts = {enabled: false};`);
    } else if (chartkitSettings.highcharts.external) {
        const {
            protocol = 'https',
            domain = 'code.highcharts.com',
            version,
            modules = [],
            publicPath,
        } = chartkitSettings.highcharts;
        const items = [
            'highcharts',
            'highcharts-more',
            ...modules.map((item) => `modules/${item}`),
        ];

        const base = publicPath
            ? publicPath.replace(/\/$/, '')
            : `${protocol}://${domain}${version ? `/${version}` : ''}`;

        chartkitScripts.push(
            ...items.map((item) => ({
                src: `${base}/${item}.js`,
                defer: true,
            })),
        );
    }

    return {
        scripts: chartkitScripts,
        inlineScripts: chartkitInlineScripts,
    };
}
