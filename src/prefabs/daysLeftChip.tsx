import { prefab, Icon } from '@betty-blocks/component-sdk';

import { DaysLeftChip } from './structures/DaysLeftChip';

const attributes = {
  category: 'CONTENT',
  icon: Icon.TitleIcon,
  keywords: [''],
};

export default prefab('DaysLeftChip', attributes, undefined, [DaysLeftChip({})]);
