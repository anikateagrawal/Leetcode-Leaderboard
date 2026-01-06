import os

# File paths (all should exist, even if empty)
FILES = {
    "day": "day.txt",
    "mobno": "mobno.txt",
    "name": "name.txt",
    "roll": "roll.txt",
    "section": "sections.txt",
    "url": "urls.txt"
}

def read_all_data():
    """Reads all files and returns data as a list of dicts."""
    data = []
    try:
        with open(FILES["roll"], "r") as f_roll, \
             open(FILES["name"], "r") as f_name, \
             open(FILES["mobno"], "r") as f_mob, \
             open(FILES["day"], "r") as f_day, \
             open(FILES["section"], "r") as f_sec, \
             open(FILES["url"], "r") as f_url:

            rolls = [line.strip() for line in f_roll]
            names = [line.strip() for line in f_name]
            mobs = [line.strip() for line in f_mob]
            days = [line.strip() for line in f_day]
            secs = [line.strip() for line in f_sec]
            urls = [line.strip() for line in f_url]

            for i in range(len(rolls)):
                data.append({
                    "roll": rolls[i],
                    "name": names[i],
                    "mobno": mobs[i],
                    "day": days[i],
                    "section": secs[i],
                    "url": urls[i]
                })
    except FileNotFoundError as e:
        print(f"Error: {e}")
    return data

def save_all_data(data):
    """Saves the list of dicts back into separate files."""
    with open(FILES["roll"], "w") as f_roll, \
         open(FILES["name"], "w") as f_name, \
         open(FILES["mobno"], "w") as f_mob, \
         open(FILES["day"], "w") as f_day, \
         open(FILES["section"], "w") as f_sec, \
         open(FILES["url"], "w") as f_url:
        
        for student in data:
            f_roll.write(student["roll"] + "\n")
            f_name.write(student["name"] + "\n")
            f_mob.write(student["mobno"] + "\n")
            f_day.write(student["day"] + "\n")
            f_sec.write(student["section"] + "\n")
            f_url.write(student["url"] + "\n")

def add_student():
    data = read_all_data()
    roll = input("Enter Roll Number: ").strip()
    if any(s["roll"] == roll for s in data):
        print("Roll number already exists!")
        return
    name = input("Enter Name: ").strip()
    mobno = input("Enter Mobile No: ").strip()
    day = input("Enter Day: ").strip()
    section = input("Enter Section: ").strip()
    url = input("Enter URL: ").strip()
    data.append({"roll": roll, "name": name, "mobno": mobno, "day": day, "section": section, "url": url})
    save_all_data(data)
    print("Student added successfully.")

def update_student():
    data = read_all_data()
    roll = input("Enter Roll Number to Update: ").strip()
    for student in data:
        if student["roll"] == roll:
            print(f"Current Data: {student}")
            student["name"] = input(f"Enter Name [{student['name']}]: ").strip() or student["name"]
            student["mobno"] = input(f"Enter Mobile No [{student['mobno']}]: ").strip() or student["mobno"]
            student["day"] = input(f"Enter Day [{student['day']}]: ").strip() or student["day"]
            student["section"] = input(f"Enter Section [{student['section']}]: ").strip() or student["section"]
            student["url"] = input(f"Enter URL [{student['url']}]: ").strip() or student["url"]
            save_all_data(data)
            print("Student updated successfully.")
            return
    print("Roll number not found!")

def show_menu():
    while True:
        print("\n=== Student Management ===")
        print("1. Add Student")
        print("2. Update Student")
        print("3. Show All Students")
        print("4. Exit")
        choice = input("Enter choice: ").strip()
        if choice == "1":
            add_student()
        elif choice == "2":
            update_student()
        elif choice == "3":
            for s in read_all_data():
                print(s)
        elif choice == "4":
            break
        else:
            print("Invalid choice!")

if __name__ == "__main__":
    show_menu()
