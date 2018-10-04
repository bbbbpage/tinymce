import {
  AddEventsBehaviour,
  AlloyEvents,
  AlloyTriggers,
  Behaviour,
  Focusing,
  FormField as AlloyFormField,
  Memento,
  NativeEvents,
  Representing,
  SimpleSpec,
  Tabstopping,
  Unselecting,
  Keying,
} from '@ephox/alloy';
import { AlloyComponent } from '@ephox/alloy/lib/main/ts/ephox/alloy/api/component/ComponentApi';
import { HTMLInputElement } from '@ephox/dom-globals';
import { Fun, Option } from '@ephox/katamari';

import { ComposingConfigs } from '../alien/ComposingConfigs';
import * as Icons from '../icons/Icons';
import { UiFactoryBackstageProviders } from '../../backstage/Backstage';
import { formChangeEvent } from '../general/FormEvents';

type CheckboxState = 'checked' | 'unchecked' | 'indeterminate';

export interface CheckboxFoo {
  label: string;
  name: string;
}

export const renderCheckbox = (spec: CheckboxFoo, providerBackstage: UiFactoryBackstageProviders): SimpleSpec => {
  const repBehaviour = Representing.config({
    store: {
      mode: 'manual',
      getValue: (comp: AlloyComponent): CheckboxState => {
        const el = comp.element().dom() as HTMLInputElement;
        return el.indeterminate ? 'indeterminate' : el.checked ? 'checked' : 'unchecked';
      },
      setValue: (comp: AlloyComponent, value: CheckboxState) => {
        const el = comp.element().dom() as HTMLInputElement;
        switch (value) {
          case 'indeterminate':
            el.indeterminate = true;
            break;
          case 'checked':
            el.checked = true;
            el.indeterminate = false;
            break;
          default:
            el.checked = false;
            el.indeterminate = false;
            break;
        }
      }
    }
  });

  const toggleCheckboxHandler = (comp) => {
    comp.element().dom().click();
    return Option.some(true);
  };

  const pField = AlloyFormField.parts().field({
    factory: { sketch: Fun.identity },
    dom: {
      tag: 'input',
      classes: ['tox-checkbox__input'],
      attributes: {
        type: 'checkbox'
      }
    },

    behaviours: Behaviour.derive([
      ComposingConfigs.self(),
      Tabstopping.config({}),
      Focusing.config({ }),
      repBehaviour,
      Keying.config({
        mode: 'special',
        onEnter: toggleCheckboxHandler,
        onSpace: toggleCheckboxHandler
      }),
      AddEventsBehaviour.config('checkbox-events', [
        AlloyEvents.run(NativeEvents.change(), (component, _) => {
          AlloyTriggers.emitWith(component, formChangeEvent, { name: spec.name } );
        })
      ])
    ]),
  });

  const pLabel = AlloyFormField.parts().label({
    dom: {
      tag: 'span',
      classes: ['tox-checkbox__label'],
      innerHtml: spec.label
    },
    behaviours: Behaviour.derive([
      Unselecting.config({})
    ])
  });

  const makeIcon = (className: CheckboxState) => {
    const iconName = className === 'checked' ? 'selected' :
        className === 'unchecked' ? 'unselected' :
        'indeterminate';
    return {
      dom: {
        tag: 'span',
        classes: ['tox-icon', 'tox-checkbox-icon__' + className],
        innerHtml: Icons.get('icon-' + iconName, providerBackstage.icons)
      }
    };
  };

  const memIcons = Memento.record(
    {
      dom: {
        tag: 'div',
        classes: ['tox-checkbox__icons'],

      },
      components: [
        makeIcon('checked'),
        makeIcon('unchecked'),
        makeIcon('indeterminate'),
      ]
    }
  );

  return AlloyFormField.sketch({
    dom: {
      tag: 'label',
      classes: ['tox-checkbox'],
    },
    components: [
      pField,
      memIcons.asSpec(),
      pLabel
    ]
  });
};