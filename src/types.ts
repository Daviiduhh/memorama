export class Emoji {
  character!: string;
  name!: string;
  hexadecimal!: string;
  decimal!: string;
  id!: number;
  index!: number;
  show?: boolean;
  checked?: boolean;
}

export class Leader {
  id!: number;
  username!: string;
  time!: string;
  moves!: number;
  seconds!: number;
  date!: string
}
