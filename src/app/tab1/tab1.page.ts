import { Component, OnInit } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore } from "@angular/fire/firestore";
import { Router } from "@angular/router";

@Component({
  selector: "app-tab1",
  templateUrl: "./tab1.page.html",
  styleUrls: ["./tab1.page.scss"],
})
export class Tab1Page implements OnInit {
  empty_message = "";
  user = null;
  taskList = [];
  editing = false;
  copy = {};

  constructor(
    private router: Router,
    public ngFireAuth: AngularFireAuth,
    public ngFireStore: AngularFirestore
  ) {}

  async ngOnInit() {
    await this.ngFireAuth.onAuthStateChanged((user) => {
      if (user) {
        this.user = user;
        this.getTasks();
      } else {
        this.router.navigate(["/login"]);
      }
    });
  }

  ionViewWillEnter() {
    if (this.user) {
      this.getTasks();
    }
  }

  async getTasks() {
    let time_info = this.process_time();
    let taskCollection = this.ngFireStore.collection("task", (ref) =>
      ref
        .where("owner_id", "==", this.user.uid)
        .where("completed", "==", false)
        .where("date", "==", time_info[1])
    );
    let collector = taskCollection.valueChanges().subscribe((tasks: []) => {
      if (!this.sameList(this.taskList, tasks)) {
        this.taskList = tasks;
        this.sortTasks();
      }
      this.empty_message = "No daily tasks";

      collector.unsubscribe();
    });
  }

  addTask() {
    this.editing = true;
    let time_info = this.process_time();
    let task = {
      title: "",
      subtitle: "",
      time: time_info[0],
      date: time_info[1],
      length: "1hr",
      repeat: [],
      snooze: 0,
      completed: false,
      editing: true,
      id: "-1",
      parent_id: "-1",
      owner_id: this.user.uid,
    };

    for (let key in task) {
      this.copy[key] = task[key];
    }
    this.copy["editing"] = false;
    this.taskList.unshift(task);
  }

  editTask(task) {
    task["editing"] = true;
    this.editing = true;

    for (let key in task) {
      this.copy[key] = task[key];
    }
    this.copy["editing"] = false;
  }

  async saveTask(task) {
    let taskRef = this.ngFireStore.collection("task").doc();

    if (task["id"] != "-1") {
      taskRef = this.ngFireStore.collection("task").doc(task["id"]);
    }

    let task_send = {};
    for (let key in task) {
      task_send[key] = task[key];
    }
    task_send["editing"] = false;
    task_send["id"] = taskRef.ref.id;

    let time_info = this.process_time();
    if (task["date"] != time_info[1]) {
      let index = this.taskList.indexOf(task);
      this.taskList.splice(index, 1);
    } else if (task["completed"]) {
      let index = this.taskList.indexOf(task);
      this.taskList.splice(index, 1);
    }

    await taskRef.set(task_send).then(() => {
      task["editing"] = false;
      this.editing = false;
      this.sortTasks();
    });
  }

  cancelTask(task) {
    this.editing = false;
    if (task["id"] == "-1") {
      this.taskList.shift();
    } else {
      for (let key in task) {
        task[key] = this.copy[key];
      }
      task["editing"] = false;
    }
  }

  async completeTask(task) {
    task["completed"] = true;
    this.saveTask(task);
  }

  async snoozeTask(task) {
    let time = task["time"];
    let hour = parseInt(time.substring(0, 2));
    let min = parseInt(time.substring(3, 5));

    min += 30;//Default
    if (min > 59) {
      min -= 60;
      hour += 1;
      if (hour > 23) {
        hour = 23;
        min = 59;
      }
    }

    let hour_string = hour.toString().padStart(2, "0");
    let min_string = min.toString().padStart(2, "0");

    task["time"] = hour_string + ":" + min_string;

    this.saveTask(task);
  }

  async deleteTask(task) {
    if (task["editing"]) {
      this.editing = false;
    }

    if (task["id"] != -1) {
      let task_ref = this.ngFireStore.collection("task").doc(task["id"]);
      await task_ref.delete(); //added async and await without testing

      if (task.parent_id != "-1") {
        let habitRef = this.ngFireStore.collection("habit").doc(task.parent_id);
        let habitCollection = this.ngFireStore.collection("habit", (ref) =>
          ref.where("id", "==", task.parent_id)
        );
        let collector = habitCollection
          .valueChanges()
          .subscribe((habits: [1]) => {
            let habit = habits[0];
            habit["task_count"]--;
            habitRef.set(habit);
            collector.unsubscribe();
          });
      }
    }

    let index = this.taskList.indexOf(task);
    this.taskList.splice(index, 1);
  }

  formatHour(time) {
    let hour = parseInt(time.substring(0, 2));
    let min = parseInt(time.substring(3, 5));
    let min_string = "";

    if (min != 0) min_string = time.substring(2);

    if (hour < 12) {
      if (hour == 0) return 12 + min_string + "am";
      return hour + min_string + "am";
    } else if (hour == 12) return hour + min_string + "pm";
    else return hour - 12 + min_string + "pm";
  }

  process_time() {
    let date = new Date();
    let hour = date.getHours() + 1;
    let year = date.getFullYear().toString().padStart(2, "0");
    let month = (date.getMonth() + 1).toString().padStart(2, "0");
    let day = date.getDate();
    let hour_string = "";
    let iso_date = year + "-" + month + "-" + day;

    if (hour > 23) hour = 0;
    if (hour < 10) hour_string = "0" + hour + ":00";
    else hour_string = hour + ":00";
    return [hour_string, iso_date];
  }

  sortTasks() {
    this.taskList.sort((one, two) => {
      return one["time"].localeCompare(two["time"]);
    });
  }

  //Compares list of objects regardless of object format
  sameList(list1, list2) {
    if (list1.length != list2.length) {
      return false;
    }

    list1.sort((one, two) => {
      return one["time"].localeCompare(two["time"]);
    });
    list2.sort((one, two) => {
      return one["time"].localeCompare(two["time"]);
    });

    for (let i = 0; i < list1.length; i++) {
      let obj1 = list1[i];
      let obj2 = list2[i];
      for (let key in obj1) {
        if (JSON.stringify(obj1[key]) != JSON.stringify(obj2[key])) {
          return false;
        }
      }
    }
    return true;
  }
}
