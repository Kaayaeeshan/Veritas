import sys
import getpass
from datetime import datetime
from firebase_admin_setup import get_db, get_auth


def main():
    print("=== Veritas: create the first admin account ===\n")

    db = get_db()
    existing_admins = list(db.collection("users").where("role", "==", "admin").limit(1).stream())
    if existing_admins:
        print("An admin account already exists. This script is only for the very first one.")
        print("To create additional admins, do it from inside the app once logged in as an "
              "existing admin.")
        sys.exit(1)

    full_name = input("Admin full name: ").strip()
    email = input("Admin email: ").strip()
    password = getpass.getpass("Admin password (min 8 characters, hidden while typing): ")

    if not full_name or not email:
        print("Full name and email are required.")
        sys.exit(1)
    if len(password) < 8:
        print("Password must be at least 8 characters.")
        sys.exit(1)

    try:
        auth_user = get_auth().create_user(email=email, password=password, display_name=full_name)
        print(f"\nCreated a new Firebase Auth account for {email}.")
    except Exception as e:
       
        if "EMAIL_EXISTS" in str(e) or "already exists" in str(e).lower():
            print(f"\nAn Auth account for {email} already exists — checking whether it's missing its Firestore profile (a sign a previous run of this script was interrupted partway through)...")
            try:
                auth_user = get_auth().get_user_by_email(email)
            except Exception as lookup_error:
                print(f"Couldn't look up the existing account either: {lookup_error}")
                sys.exit(1)
            existing_doc = db.collection("users").document(auth_user.uid).get()
            if existing_doc.exists and existing_doc.to_dict().get("role"):
                print(f"That account already has a complete profile with role "
                      f"'{existing_doc.to_dict().get('role')}'.")
                update_pw = input(
                    "Update its password to the one you just typed? [y/N]: "
                ).strip().lower()
                if update_pw == "y":
                    get_auth().update_user(auth_user.uid, password=password)
                    print("Password updated. Sign in with the new password you just set.")
                else:
                    print("Left as-is — sign in with whatever password already worked before.")
                sys.exit(0 if update_pw == "y" else 1)
            print("Confirmed: that account has no (or an incomplete) Firestore profile.")
            print("Setting its password to the one you just typed in, and repairing its profile now.")
            get_auth().update_user(auth_user.uid, password=password)
        else:
            print(f"\nCouldn't create the Firebase Auth account: {e}")
            sys.exit(1)

    db.collection("users").document(auth_user.uid).set({
        "fullName": full_name,
        "email": email,
        "role": "admin",
        "createdAt": datetime.utcnow().isoformat(),
    })

    print(f"\nDone. Admin account created for {email}.")
    print("Sign in at your app's /login page with that email and the password you just set.")
    print("(There is only one login page for everyone — patients, doctors, and admins all use")
    print(" the same form. Which dashboard you land on is decided by your role in Firestore,")
    print(" not by a separate 'admin login' page.)")


if __name__ == "__main__":
    main()