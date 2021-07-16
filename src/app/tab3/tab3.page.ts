import { Component, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { ModalPage } from "../modal/modal.page";
import { AngularFirestore } from "@angular/fire/firestore";
import { AngularFireAuth } from "@angular/fire/auth";

@Component({
  selector: "app-tab3",
  templateUrl: "./tab3.page.html",
  styleUrls: ["./tab3.page.scss"],
})
export class Tab3Page implements OnInit {
  empty_message = "";
  habitList = [];
  user = null;
  editing = false;

  constructor(
    public modalController: ModalController,
    public ngFireStore: AngularFirestore,
    public ngFireAuth: AngularFireAuth
  ) {}

  async ngOnInit() {
    await this.ngFireAuth.onAuthStateChanged((user) => {
      if (user) {
        this.user = user;
        this.getHabits();
        this.empty_message = "No Habits";
      }
    });
  }

  ionViewWillEnter() {
    if (this.user) {
      this.empty_message = "";
      this.getHabits();
    }
  }

  addHabit() {
    let date = new Date();
    this.editing = true;

    let habit = {
      title: "",
      subtitle: "",
      date: date.toISOString(),
      editing: true,
      task_count: 0,
      id: -1,
      owner_id: this.user.uid,
    };
    this.habitList.unshift(habit);
  }

  cancelHabit() {
    this.editing = false;
    this.habitList.shift();
  }

  async saveHabit(habit) {
    let habitRef = this.ngFireStore.collection("habit").doc();

    let habit_send = {};
    for (let key in habit) {
      habit_send[key] = habit[key];
    }
    habit_send["editing"] = false;
    habit_send["id"] = habitRef.ref.id;

    await habitRef.set(habit_send).then(() => {
      habit["editing"] = false;
      this.editing = false;
      this.sortHabits();
    });
  }

  async getHabits() {
    let taskCollection = this.ngFireStore.collection("habit", (ref) =>
      ref.where("owner_id", "==", this.user.uid)
    );
    let collector = taskCollection.valueChanges().subscribe((habits: []) => {
      if (!this.sameList(this.habitList, habits)) {
        this.habitList = habits;
      }
      this.empty_message = "No Habits";
      collector.unsubscribe();
    });
  }

  sortHabits() {
    this.habitList.sort((one, two) => {
      return one["date"].localeCompare(two["date"]);
    });
  }

  async openModal(habit) {
    const modal = await this.modalController.create({
      component: ModalPage,
      componentProps: {
        habit: habit,
      },
    });
    return await modal.present();
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
