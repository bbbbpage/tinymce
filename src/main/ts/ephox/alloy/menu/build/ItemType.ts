import { FieldSchema, FieldProcessorAdt } from '@ephox/boulder';
import { Merger } from '@ephox/katamari';

import * as Behaviour from '../../api/behaviour/Behaviour';
import { Focusing } from '../../api/behaviour/Focusing';
import { Keying } from '../../api/behaviour/Keying';
import { Representing } from '../../api/behaviour/Representing';
import { Toggling } from '../../api/behaviour/Toggling';
import * as AlloyEvents from '../../api/events/AlloyEvents';
import * as AlloyTriggers from '../../api/events/AlloyTriggers';
import * as NativeEvents from '../../api/events/NativeEvents';
import * as SystemEvents from '../../api/events/SystemEvents';
import * as Fields from '../../data/Fields';
import * as ItemEvents from '../util/ItemEvents';
import { AlloySpec } from '../../api/component/SpecTypes';
import * as AddEventsBehaviour from '../../api/behaviour/AddEventsBehaviour';
import { NormalItemDetail } from '../../ui/types/ItemTypes';
import { SketchBehaviours } from '../../api/component/SketchBehaviours';

const builder = (detail: NormalItemDetail): AlloySpec => {
  return {
    dom: Merger.deepMerge(
      detail.dom(),
      {
        attributes: {
          role: detail.toggling().isSome() ? 'menuitemcheckbox' : 'menuitem'
        }
      }
    ),
    behaviours: Merger.deepMerge(
      Behaviour.derive([
        detail.toggling().fold(Toggling.revoke, (tConfig) => {
          return Toggling.config(
            Merger.deepMerge({
              aria: {
                mode: 'checked'
              }
            }, tConfig)
          );
        }),
        Focusing.config({
          ignore: detail.ignoreFocus(),
          // Rationale: because nothing is focusable, when you click
          // on the items to choose them, the focus jumps to the first
          // focusable outer container ... often the body. If we prevent
          // mouseDown ... that doesn't happen. But only tested on Chrome/FF.
          stopMousedown: detail.ignoreFocus(),
          onFocus (component) {
            ItemEvents.onFocus(component);
          }
        }),
        Keying.config({
          mode: 'execution'
        }),
        Representing.config({
          store: {
            mode: 'memory',
            initialValue: detail.data()
          }
        }),

        AddEventsBehaviour.config('item-type-events', [
          // Trigger execute when clicked
          AlloyEvents.run(SystemEvents.tapOrClick(), AlloyTriggers.emitExecute),

          // Like button, stop mousedown propagating up the DOM tree.
          AlloyEvents.cutter(NativeEvents.mousedown()),

          AlloyEvents.run(NativeEvents.mouseover(), ItemEvents.onHover),

          AlloyEvents.run(SystemEvents.focusItem(), Focusing.focus)
        ])
      ]),
      SketchBehaviours.get(detail.itemBehaviours()),

    ),
    components: detail.components(),

    domModification: detail.domModification(),

    eventOrder: detail.eventOrder()
  };
};

const schema: FieldProcessorAdt[] = [
  FieldSchema.strict('data'),
  FieldSchema.strict('components'),
  FieldSchema.strict('dom'),

  FieldSchema.option('toggling'),

  // Maybe this needs to have fewer behaviours
  SketchBehaviours.field('itemBehaviours', [ Toggling, Focusing, Keying, Representing ]),

  FieldSchema.defaulted('ignoreFocus', false),
  FieldSchema.defaulted('domModification', { }),
  Fields.output('builder', builder),
  FieldSchema.defaulted('eventOrder', { })
];

export default schema;