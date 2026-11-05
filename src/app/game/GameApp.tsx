import Journey from './Journey';
import { LifeSoundProvider } from './LifeSound';

export default function GameApp() {
  return <LifeSoundProvider><Journey/></LifeSoundProvider>;
}
