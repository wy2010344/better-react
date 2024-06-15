
export interface OnboardingData {
  id: number;
  animation: Promise<any>;
  text: string;
  textColor: string;
  backgroundColor: string;
  animationBg: string;
}

const data: OnboardingData[] = [
  {
    id: 1,
    animation: import("./a1.json"),
    text: 'Lorem Ipsum dolor sit amet',
    textColor: '#ffffff',
    backgroundColor: '#fcb7d7',
    //白色
    animationBg: '#ffffff',
  },
  {
    id: 2,
    animation: import("./a2.json"),
    text: 'Lorem Ipsum dolor sit amet',
    textColor: '#000000',
    backgroundColor: '#ffffff',
    //蓝色
    animationBg: '#003cc9',
  },
  {
    id: 3,
    animation: import("./a3.json"),
    text: 'Lorem Ipsum dolor sit amet',
    textColor: '#ffffff',
    backgroundColor: '#003cc9',
    //粉色
    animationBg: '#fcb7d7',
  },
];

export default data;