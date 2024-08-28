#include <iostream>

using namespace std;

int main()
{
   const string code= "support";
   string input;

   cout << "-------------B R E A K Condition----------------" <<endl;
    do
    {
      cout << "Enter your Password: ";
      cin >>input;

      if (input == code)
      {
          break;
      }
      else
      {
          cout << "Password Access is denied" <<endl;
      }

    }while(true);

    cout <<endl;
    cout << "Great! Password is accepted" <<endl;

    cout <<endl;
    cout << "             C O N T I N U E Condition" <<endl;
    for (int a=0; a<5; a++)
    {
        cout << "Great! Password is accepted" <<endl;
        if (a < 2)
        {
            continue;
        }
        cout << "loading............" <<endl;
    }

    return 0;
}
