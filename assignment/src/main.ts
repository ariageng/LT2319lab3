import { setup, createActor, fromPromise, assign } from "xstate";

const FURHATURI = "127.0.0.1:54321";


async function fhUser() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/users`, {
    method: "POST",
    headers: myHeaders,
    body: "",
  });
}


async function fhTrackUser() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/attend?user=CLOSEST`, {
    method: "POST",
    headers: myHeaders,
    body: "",
  });
}

async function fhSay(text: string) { //return a Promise
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  const encText = encodeURIComponent(text);
  return fetch(`http://${FURHATURI}/furhat/say?text=${encText}&blocking=true`, {
    method: "POST",
    headers: myHeaders,
    body: "",
  });
}

async function thinkingGesture() {
  const myHeaders = new Headers(); 
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=true`, 
  {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      name: "thinkingGesture",
      frames: [
        {
          time: [0, 0.4], //ADD THE TIME FRAME OF YOUR LIKING // in 0.4 seconds, furhat will do this
          persist: true,
          params: {
            "LOOK_DOWN": 0.9, //0 for the lowest, 1 for the highest level of change
            //ADD PARAMETERS HERE IN ORDER TO CREATE A GESTURE
          },
        },
        {
          time: [0.4, 0.8], //
          persist: true,
          params: {
            "LOOK_RIGHT": 0.9, //0 for the lowest, 1 for the highest level of change
            //ADD PARAMETERS HERE IN ORDER TO CREATE A GESTURE
          },
        },
        {
          time: [0.8, 1.2], //ADD THE TIME FRAME OF YOUR LIKING // in 0.4 seconds, furhat will do this
          persist: true,
          params: {
            "LOOK_UP": 0.9, //0 for the lowest, 1 for the highest level of change
            //ADD PARAMETERS HERE IN ORDER TO CREATE A GESTURE
          },
        },
        {
          time: [1.2, 1.6], //ADD THE TIME FRAME OF YOUR LIKING // in 0.4 seconds, furhat will do this
          persist: true,
          params: { //0 for the lowest, 1 for the highest level of change
            "LOOK_LEFT": 0.9,
            //ADD PARAMETERS HERE IN ORDER TO CREATE A GESTURE
          },
        },
        {
          time: [2.0], //ADD TIME FRAME IN WHICH YOUR GESTURE RESETS // for 0.7 seconds, furhat will do this
          persist: true,
          params: {
            reset: true,
          },
        },
        //ADD MORE TIME FRAMES IF YOUR GESTURE REQUIRES THEM
      ],
      class: "furhatos.gestures.Gesture",
    }),
  });
}

async function spaceoutGesture() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=true`, // blocking=true means that the gesture will be executed before
  {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      name: "spaceoutGesture",
      frames: [
        {
          time: [0, 0.4], //ADD THE TIME FRAME OF YOUR LIKING // in 0.4 seconds, furhat will do this
          persist: true,
          params: {
            "EYE_LOOK_UP_RIGHT": 0.9, //0 for the lowest, 1 for the highest level of change
            "EYE_LOOK_UP_LEFT": 0.9,
            "BROW_UP_LEFT": 0.9,
            "BROW_UP_RIGHT": 0.9,
            //ADD PARAMETERS HERE IN ORDER TO CREATE A GESTURE
          },
        },
        {
          time: [0.7], //ADD TIME FRAME IN WHICH YOUR GESTURE RESETS // for 0.7 seconds, furhat will do this
          persist: true,
          params: {
            reset: true,
          },
        },
        //ADD MORE TIME FRAMES IF YOUR GESTURE REQUIRES THEM
      ],
      class: "furhatos.gestures.Gesture",
    }),
  });
}

async function fhGesture(text: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(
    `http://${FURHATURI}/furhat/gesture?name=${text}&blocking=true`,
    {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({name:text}), 
    },
  );
}

async function fhListen() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/listen`, { 
    method: "GET",
    headers: myHeaders,
  })
    .then((response) => response.body)
    .then((body) => body.getReader().read())
    .then((reader) => reader.value)
    .then((value) => JSON.parse(new TextDecoder().decode(value)).message);
}

async function playAudio() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/say?url=https://furhat-audio.s3.eu-north-1.amazonaws.com/suspense.wav&blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: "",
  });
}

const dmMachine = setup({
  actors: {
    fhHello: fromPromise<any, null>(async () => {
      return Promise.all([
        fhSay("Oh hey. Glad that you woke me up. I just had a bizarre dream. Can you guess what I just dreamt of?"),fhGesture("BigSmile")
      ]);
    }),
    //fhL: fromPromise<any, null>(async () => {
    // return fhListen();
    //}),
    // laugh and speak action
    speakG: fromPromise<any, {text: string}>(async ({ input}) => { //<any, {text: string}> means that the input is of type {text: string}, and the output is of type any
      return Promise.all([ //need to add Promise.all to return multiple actions
        fhSay(input.text),
        //fhGesture("Nod"),
        spaceoutGesture(),
      ]);
    }),
    fhUser: fromPromise<any, null>(async () => {
      return Promise.all([
        fhUser(),
      ]);
    }),
    fhTrack: fromPromise<any, null>(async () => {
      return Promise.all([ 
        fhTrackUser(),
        fhGesture("Smile"),
      ]);
    }),
    fhListen: fromPromise<any, null>(async () => {
      return Promise.all([fhListen(),thinkingGesture(),playAudio()]);
    }),
  },
}).createMachine({
  id: "root",
  initial: "Start",
  states: {
    Start: { after: { 1000: "CreateUser" } },
    CreateUser: {
      invoke: {
        src: "fhUser",
        onDone: { target: "StartTracking" },
        onError: { target: "Fail" },
      },
    },
    StartTracking: {
      invoke: {
        src: "fhTrack",
        input: null,
        onDone: { target: "Next" },
        onError: { target: "Fail" },
      },
    },
    Next: {
      invoke: {
        src: "fhHello",
        input: null,
        onDone: {
          target: "Listen",
          actions: ({ event }) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },
    Listen: {
      invoke: {
        src: "fhListen",
        onDone: {
          target: "Recognised",
          actions: ({ event }) => {
            console.log(event.output);
          },
        }
     },
    },
    Recognised: {
      invoke: {
        src: "speakG",
        input: {text: "Haha That's funny. I dreamt that I was trapped in a robot with only a head, and talk only what programmers tell me to say. What a nice Halloween dream!"}, 
        onDone: {
          target: "Done",
          actions: ({ event }) => console.log(event.output),
        },
      }
    },
    Done: {},
    Fail: {},
  },
});

const actor = createActor(dmMachine).start();
console.log(actor.getSnapshot().value);

actor.subscribe((snapshot) => {
  console.log(snapshot.value);
});
