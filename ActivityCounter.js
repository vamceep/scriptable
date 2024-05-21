// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: light-gray;
// icon-glyph: magic;

const Cache = importModule('Cache');
const appCache = new Cache('activity_counter');

// Text size for the header text. Ex: "Daily Log for Fri, Nov 6"
const TITLE_TEXT_SIZE = 20;
const VALUE_TEXT_SIZE = 15;
// Spacing below the header text
const TITLE_TEXT_SPACING = 10;
const FONT = "PingFangSC-Thin";

const DAY_HISTORY = 7;
const DATE_KEY = "date";
const KEY_SEPERATOR = "_";
const MONITOR_ITEMS = [
  {
    name: "Angry😡",
    value: "Unnecessarily got angry 😡",
    count: 0,
    impact: "-",
  },
  {
    name: "Hasty😱",
    value: "Did not gave much thought",
    count: 0,
    impact: "-",
  },
  {
    name: "Jog  🏃",
    value: "Did not gave much thought",
    count: 0,
    impact: "+",
  }
];

function createAlert() {
  const alert = new Alert();
  alert.title = "Activity update";

  MONITOR_ITEMS.forEach(entry => {
    alert.addAction(entry.name);
  });
  alert.addAction('Cancel');
  return alert;
}

function createWidget(monitorItems) {
  // Widget
  const widget = new ListWidget();
  const bgColor = new LinearGradient();
  bgColor.colors = [new Color("#29323c"), new Color("#1c1c1c")];
  bgColor.locations = [0.0, 1.0];
  widget.backgroundGradient = bgColor;
  widget.setPadding(10, 10, 10, 10);

  // Main stack
  const stack = widget.addStack();
  stack.layoutVertically();

  // Top stack
  const topStack = stack.addStack();
  topStack.layoutHorizontally();

  const dateTextLine = topStack.addText("Weekly activity tracker");
  dateTextLine.textColor = Color.white();
  dateTextLine.font = new Font(FONT, TITLE_TEXT_SIZE);

  // Horizontal spacer under date string
  stack.addSpacer(TITLE_TEXT_SPACING);

  // Main bottom stack
  for (let key in monitorItems) {
    const row = stack.addStack();
    const textLine = row.addText(setPadding(key,10) + " " + setPadding(monitorItems[key]).countValues.join(" "));
    textLine.textColor = Color.white();
    textLine.font = new Font(FONT, VALUE_TEXT_SIZE);
    stack.addSpacer();
  }
  return widget;
}

function setPadding(value, len) {
  while(value.length < len) {
    value = value+ " ";
  }
  return value;
}

async function getWeeklyActivity() {
    oneWeekDateKeys = [];
    for(let i = 0; i < DAY_HISTORY; i++) {
        let date = new Date();
        date.setDate(date.getDate() - i);
        oneWeekDateKeys.push(getCacheKey(date));
    }
    oneWeekActivtyData = [];
    for(const key of oneWeekDateKeys) {
        let data  = null;
        await getActivityData(key).then(val => data = val, err => console.log(err));
        oneWeekActivtyData.push(data)
    }
    oneWeekActivtyData.reverse();
    return oneWeekActivtyData;
}

async function incrimentCountAndUpdateForActivity(activity, key) {
  console.log("in incr method.. " + JSON.stringify(activity));
  if(key == null)
      key = getCacheKey(new Date());
  let dayData = null;
  await getActivityData(key).then(data => dayData = data, err => console.log(err));
  const activityData = dayData.find(x => x.name == activity);
  const count = (activityData?.count || 0) + 1;
  activityData.count = count;
  dayData[activity] = activityData;
  updateActivities(dayData, key);
}

async function getActivityData(key) {
  let data = await appCache.read(key);
  if(!data) {
      data = MONITOR_ITEMS;
  }
  data[DATE_KEY] = key;
  return data;
}

function transformData(weeklyData) {
  var transformedData = {};
  for(var item of MONITOR_ITEMS) {
    let name = item["name"];
    if(transformedData[name] == null) {
      transformedData[name] = {
        "countValues": new Array(),
        "impact": item.impact
      };
    }
    if(weeklyData != null) {
      for(var dayData of weeklyData) {
        transformedData[name].countValues.push(dayData.find(x => x.name == name)?.count || 0);
      }
    }
  }
  return transformedData;
}

function updateActivities(activities, key) {
  appCache.write(key, activities);
}

function getCacheKey(date) {
  let val = [date.getDate() +"", date.getMonth() +"", date.getFullYear() + ""].join(KEY_SEPERATOR);
  return val;
}


let weeklyData = null;

// Show alert with current data (if running script in app)
if (config.runsInApp) {
  const alert = createAlert();
  const response = await alert.present();
  if(response < MONITOR_ITEMS.length) {
    console.log(`clicked : ${response}`);
    await incrimentCountAndUpdateForActivity(MONITOR_ITEMS[response].name).then(data => weeklyData = data, err=> console.log(err));
    console.log("returned ..." + JSON.stringify(weeklyData));
  }
}
await getWeeklyActivity().then(data => weeklyData = data, err => console.log(err));
const widget = createWidget(transformData(weeklyData));
// Set widget
Script.setWidget(widget);
// Present the widget
widget.presentMedium();
Script.complete();