type Room = {
  connectionIdCreator: string;
  connectionIdInvited: string;
  createAt: string;
  invitedName: string;
  creatorIp: string;
  invitedIp: string;
  creatorName: string;
  creatorId: string;
  invitedId: string;
  inviteQuestions: Question[];
  creatorQuestions: Question[];
};

type Question = {
  title: string;
  answers?: {
    title: string;
    isCorrect: boolean;
  }[];
};
export default Room;
