import { storiesOf } from '@storybook/svelte';
import { withKnobs, text } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import WelcomePage from '../build/ui/components/WelcomePage/WelcomePage.html';

storiesOf('WelcomePage', module)
  .addDecorator(withKnobs)
  .add('with text', () => {
    const name = text('name', 'user');
    return {
      Component: WelcomePage,
      data: {
        name,
      },
      on: {
        click: action('clicked')
      }
    }
  })

