// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: magic;

const Cache = importModule('Cache');
const appCache = new Cache('activity_counter');

const TITLE_TEXT_SIZE = 15;
const VALUE_TEXT_SIZE = 12;

const TITLE_TEXT_SPACING = 10;
// const FONT = "PingFangSC-Thin";
const FONT = "Menlo";

const DAY_HISTORY = 7;
const DATE_KEY = "date";
const KEY_SEPERATOR = "_";
const MONITOR_ITEMS = [
  {
    name: "Books📚",
    id: "0",
    count: 0,
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
    const textLine = row.addText(setPadding(key,15) + "" + monitorItems[key].done.join(" "));
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

async function incrimentCountAndUpdateForActivity(activityId, key) {
  if(key == null)
      key = getCacheKey(new Date());
  let currentDayData = null;
  await getActivityData(key).then(data => currentDayData = data, err => console.log(err));
  let activityData = currentDayData.find(x => x.id == activityId);
  if(activityData == null) {
    activityData = MONITOR_ITEMS.find(x => x.id == activityId)
  }
  const count = (activityData?.count || 0) + 1;
  activityData.count = count;
  currentDayData[activityId] = activityData;
  updateActivities(currentDayData, key);
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
    let name = item.name;
    if(transformedData[name] == null) {
      transformedData[name] = {
        "countValues": new Array(),
        "impact": item.impact,
        "id": item.id,
        "done": new Array(),
      };
    }
    if(weeklyData != null) {
      for(var dayData of weeklyData) {
        const activityData = dayData.find(x => x.id == item.id);
        transformedData[name].countValues.push(activityData?.count || 0);
        transformedData[name].done.push((activityData?.count || 0) > 0? "✅": "❌");
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
    await incrimentCountAndUpdateForActivity(MONITOR_ITEMS[response].id).then(data => weeklyData = data, err=> console.log(err));
  }
}
await getWeeklyActivity().then(data => weeklyData = data, err => console.log(err));
const widget = createWidget(transformData(weeklyData));
// Set widget
Script.setWidget(widget);
// Present the widget
widget.presentLarge();
Script.complete();