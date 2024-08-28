#include <iostream>

using namespace std;

int main()
{
    cout << "\t ---------------------Listing By Arrays-----------------------" <<endl;
    cout << "Code by: Michael N.A Quaye                      Email:millcode@outlook.com" <<endl;
    string days[7];
    days[0] = "1. Sunday";
    days[1] = "2. Monday";
    days[2] = "3. Tuesday";
    days[3] = "4. Wednesday";
    days[4] = "5. Thursday" ;
    days[5] = "6. Friday";
    days[6] = "7. Saturday";
    cout << "\t Days Of The Week" <<endl;
    for (int a=0; a<7; a++)
    {
        cout <<days[a] <<endl;
    }

    string months[12] = { "1.  January", "2.  February", "3.  March", "4.  April", "5.  May", "6.  June", "7.  July", "8.  August", "9.  September", "10. October", "11. November", "12. December"};
    cout << endl;
    cout << "\t Months Of The Year" <<endl;
    for (int a=0; a<12; a++)
    {
        cout <<months[a] <<endl;
    }
    return 0;
}
