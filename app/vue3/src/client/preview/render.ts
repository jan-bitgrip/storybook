import dedent from 'ts-dedent';
import { createApp, h, shallowRef, ComponentPublicInstance } from 'vue';
import { Args } from '@storybook/addons';
import { RenderContext, StoryFnVueReturnType } from './types';

const activeStoryComponent = shallowRef<StoryFnVueReturnType | null>(null);

interface Root extends ComponentPublicInstance {
  storyArgs?: Args;
}

let root: Root | null = null;

export const storybookApp = createApp({
  // If an end-user calls `unmount` on the app, we need to clear our root variable
  unmounted() {
    root = null;
  },

  data() {
    return {
      storyArgs: undefined,
    };
  },

  setup() {
    return () => {
      if (!activeStoryComponent.value)
        throw new Error('No Vue 3 Story available. Was it set correctly?');
      return h(activeStoryComponent.value);
    };
  },
});

export default function render({
  storyFn,
  kind,
  name,
  args,
  showMain,
  showError,
  showException,
  forceRender,
}: RenderContext) {
  storybookApp.config.errorHandler = showException;

  const element: StoryFnVueReturnType = storyFn();

  if (!element) {
    showError({
      title: `Expecting a Vue component from the story: "${name}" of "${kind}".`,
      description: dedent`
        Did you forget to return the Vue component from the story?
        Use "() => ({ template: '<my-comp></my-comp>' })" or "() => ({ components: MyComp, template: '<my-comp></my-comp>' })" when defining the story.
      `,
    });
    return;
  }

  showMain();

  if (!forceRender) {
    activeStoryComponent.value = element;
  }

  if (!root) {
    root = storybookApp.mount('#root');
  }

  root.storyArgs = args;
}
