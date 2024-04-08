import {
  sizes,
  size,
  color,
  option,
  ThemeColor,
  model,
  text,
  showIf
} from '@betty-blocks/component-sdk';
import { advanced } from '../advanced';

export const filterComponentOptions = {
  actionVariableId: option('ACTION_JS_VARIABLE', {
    label: 'Action input variable',
    value: '',
  }),
  modelId: model('Model'),
  height: size('Height', {
    value: '',
    configuration: {
      as: 'UNIT',
    },
  }),
  width: size('Width', {
    value: '',
    configuration: {
      as: 'UNIT',
    },
  }),
  outerSpacing: sizes('Outer space', {
    value: ['0rem', '0rem', '0rem', '0rem'],
  }),
  highlightColor: color('Highlight Color', {
    value: ThemeColor.DARK,
  }),
  textColor: color('Text Color', {
    value: ThemeColor.WHITE,
  }),
  borderColor: color('Border color', {
    value: ThemeColor.ACCENT_1,
  }),
  borderRadius: size('Border radius', {
    value: '4px',
    configuration: {
      as: 'UNIT',
    },
  }),
  backgroundColor: color('Background color', {
    value: ThemeColor.TRANSPARENT,
  }),
  backgroundColorAlpha: option('NUMBER', {
    label: 'Background color opacity',
    value: 100,
  }),
  propertyWhiteList: text('Property Whitelist', {
    configuration: {
      as: 'MULTILINE'
    }
  }),
  propertyBlackLicks: text('Property Blacklist', {
    value: 'id',
    configuration: {
      as: 'MULTILINE'
    }
  }),
  ...advanced,
};
