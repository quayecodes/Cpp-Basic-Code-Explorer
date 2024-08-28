#include <iostream>

using namespace std;

void game()
{
    cout << "\t  List of Games" <<endl;
    cout << "1. Football" <<endl;
    cout << "2. Basketball" <<endl;
    cout << "3. Hockey" <<endl;
    cout << "4. Volleyball" <<endl;
    cout << "5. Handball" <<endl;
}

int prompt()
{
   cout << "Select Your Favorite Game >> ";
   int input;
   cin >> input;

   return input;
}

void creator()
{
    cout << "\t -----------------R  E T U R N    F U N C T I O N----------------------" <<endl;
    cout << "Code By: Michael N.A Quaye                    Email: millcode@outlook.com" <<endl;
}
int main()
{
    creator();
    game();
    int fav = prompt();

    switch(fav)
    {
    case 1:
        {
            cout <<endl;
            cout << "Cool, Your favorite game is Football" <<endl;
            cout << "Hey There! Why do you like football? ";
            string input1;
            cin >> input1;
            cout << "Thank You For Your Feedback!" <<endl;
            break;
        }
    case 2:
        {
            cout <<endl;
            cout << "Nice! Your favorite game is Basketball" <<endl;
            cout << "Hello Friend! Why do you like Basketball? ";
            string input1;
            cin >>input1;
            cout << "Thank You For Sharing" <<endl;
            break;
        }
    case 3:
        {
            cout <<endl;
            cout << "Wow! Your Favorite game is Hockey" <<endl;
            cout << "Hi Buddy! Why do you like hockey? ";
            string input1;
            cin >> input1;
            cout << "Thank You For Sharing" <<endl;
            break;
        }
    case 4:
        {
            cout << endl;
            cout << "Wow! Your Favorite game is Volleyball" <<endl;
            cout << "Hello Dear! Why do you like Volleyball? ";
            string input1;
            cin >> input1;
            cout << "Thank You For Your Feedback!" <<endl;
            break;
        }
    case 5:
        {
            cout << endl;
            cout << "Wow! Your Favorite game is Handball" <<endl;
            cout << "Hey Dear! Why do you like Handball? ";
            string input1;
            cin >> input1;
            cout << "Thank You For Sharing With Us" <<endl;
            break;
        }
        default:
        {
            cout << "You Entered Invalid Number!" <<endl;
        }
    }

    return 0;
}
