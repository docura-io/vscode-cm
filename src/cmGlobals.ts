'use strict'

import { CMReferenceProvider } from './cmReferenceProvider';

export let refProvider: CMReferenceProvider;

export function setup() {
    refProvider = new CMReferenceProvider();
}